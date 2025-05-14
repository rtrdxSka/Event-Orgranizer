import mongoose from "mongoose";
import { INTERNAL_SERVER_ERROR, BAD_REQUEST, UNAUTHORIZED, NOT_FOUND, FORBIDDEN } from "../constants/http";

import EventModel, { EventDocument } from "../models/event.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { CreateEventInput, createEventSchema } from "../controllers/event.schemas";
import EventResponseModel from "../models/eventResponse.model";
import { CreateEventResponseInput } from "../controllers/eventResponse.schemas";

import { sendMail } from "../utils/sendMail";
import { getNewOptionsAddedTemplate } from "../utils/emailTemplates";
import { APP_ORIGIN } from "../constants/env";

interface CustomFieldOption {
  id: number;
  label: string;
  checked?: boolean;
}

interface CustomField {
  id?: number;
  type: 'text' | 'list' | 'radio' | 'checkbox';
  title: string;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  optional?: boolean;
  value?: string;
  options?: CustomFieldOption[];
  values?: string[];
  maxEntries?: number;
  allowUserAdd?: boolean;
  maxOptions?: number;
  allowUserAddOptions?: boolean;
  selectedOption?: number | null;
}

export const createEvent = async (data: CreateEventInput) => {
  // Validate the input data
  const validationResult = createEventSchema.safeParse(data);
  if (!validationResult.success) {
    console.log("Validation error details:", JSON.stringify(validationResult.error.format(), null, 2));
    
    // Get detailed error message
    const errorDetails = validationResult.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join('; ');
    
    appAssert(false, BAD_REQUEST, `Validation failed: ${errorDetails}`);
  }

  // Verify user exists
  const userExists = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(data.createdBy)
  });
 
  appAssert(
    userExists,
    UNAUTHORIZED,
    "User not authorized to create events"
  );

  try {
    // Filter out empty values
    const filteredDates = data.eventDates.dates.filter(date => date.trim() !== "");
    const filteredPlaces = data.eventPlaces.places.filter(place => place.trim() !== "");

    // Convert customFields to Map with proper validation
    const customFieldsMap = new Map();
    if (data.customFields) {
      // First validate each custom field
      Object.entries(data.customFields).forEach(([key, field]) => {
        // Perform additional validation based on field type
        switch (field.type) {
          case "text":
            // Text fields validation - ensure value is properly set
            if (field.readonly && (!field.value || field.value.trim() === "")) {
              appAssert(false, BAD_REQUEST, `Read-only text field "${field.title}" must have a value`);
            }
            break;

          case "radio":
            // Radio fields validation
            if (field.options.length < 2) {
              appAssert(false, BAD_REQUEST, `Radio field "${field.title}" must have at least 2 options`);
            }
            if (field.readonly && field.selectedOption === null) {
              appAssert(false, BAD_REQUEST, `Read-only radio field "${field.title}" must have a selected option`);
            }
            // Validate option labels
            field.options.forEach((option, index) => {
              if (!option.label || option.label.trim() === "") {
                appAssert(false, BAD_REQUEST, `Option ${index + 1} in field "${field.title}" must have a label`);
              }
            });
            break;

          case "checkbox":
            // Checkbox fields validation
            if (field.options.length < 1) {
              appAssert(false, BAD_REQUEST, `Checkbox field "${field.title}" must have at least 1 option`);
            }
            // Validate option labels
            field.options.forEach((option, index) => {
              if (!option.label || option.label.trim() === "") {
                appAssert(false, BAD_REQUEST, `Option ${index + 1} in field "${field.title}" must have a label`);
              }
            });
            break;

          case "list":
            // List fields validation
            if (field.readonly) {
              if (field.allowUserAdd) {
                appAssert(false, BAD_REQUEST, `Read-only list field "${field.title}" cannot allow users to add entries`);
              }
              if (field.maxEntries > 0 && field.values.length !== field.maxEntries) {
                appAssert(false, BAD_REQUEST, `Read-only list field "${field.title}" must have exactly ${field.maxEntries} entries, but has ${field.values.length}`);
              }
              if (field.values.some(v => !v || v.trim() === "")) {
                appAssert(false, BAD_REQUEST, `All entries in read-only list field "${field.title}" must have values`);
              }
            } else{
              const hasEmptyField = field.values.some(v => v.trim() === '');
              const hasRoomForMore = field.maxEntries === 0 || field.values.length < field.maxEntries;
              if (!field.allowUserAdd) {
                appAssert(false, BAD_REQUEST, `List field "${field.title}" must allow users to add entries`);
              }else{
                
                if (!hasEmptyField && !hasRoomForMore) {
                  appAssert(false, BAD_REQUEST, `List field "${field.title}" is full and does not allow more entries`);
                }
              }
            }
            // Validate max entries
            if (field.maxEntries > 0 && field.values.length > field.maxEntries) {
              appAssert(false, BAD_REQUEST, `Number of entries in list field "${field.title}" (${field.values.length}) exceeds maximum allowed (${field.maxEntries})`);
            }
            break;
        }

        // Add validated field to the map
        customFieldsMap.set(key, field);
      });
    }

    // Prepare voting categories if not provided
    let votingCategories = data.votingCategories || [];

    // Create default categories if none exist
    if (votingCategories.length === 0) {
      // Add date category
      if (filteredDates.length > 0) {
        votingCategories.push({
          categoryName: "date",
          options: filteredDates.map(date => ({
            optionName: date,
            votes: []
          }))
        });
      }

      // Add place category
      if (filteredPlaces.length > 0) {
        votingCategories.push({
          categoryName: "place",
          options: filteredPlaces.map(place => ({
            optionName: place,
            votes: []
          }))
        });
      }
    }

    const closesBy = data.closesBy ? new Date(data.closesBy) : null;

    // Create the event document without explicitly setting eventUUID
    // The model will handle generating a unique eventUUID through its default or middleware
    const event = await EventModel.create({
      name: data.name,
      description: data.description,
      createdBy: new mongoose.Types.ObjectId(data.createdBy),
      customFields: customFieldsMap,
      place: null, // Default place to null as per model
      eventDate: null, // Default eventDate to null
       closesBy: closesBy,
       status:'open',
      eventDates: {
        dates: filteredDates,
        maxDates: data.eventDates.maxDates,
        allowUserAdd: data.eventDates.allowUserAdd,
        maxVotes: data.eventDates.maxVotes
      },
      eventPlaces: {
        places: filteredPlaces,
        maxPlaces: data.eventPlaces.maxPlaces || 0,
        allowUserAdd: data.eventPlaces.allowUserAdd,
        maxVotes: data.eventPlaces.maxVotes
      },
      votingCategories
    });

    appAssert(
      event,
      INTERNAL_SERVER_ERROR,
      "Failed to create event"
    );

    return {
      event
    };
  } catch (error) {
    console.error("Error creating event:", error);
    appAssert(
      false,
      INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : "Failed to create event"
    );
  }
}


export const getEventByUUID = async (eventUUID: string) => {
  const event = await EventModel.findOne({ eventUUID });
  
  appAssert(
    event,
    NOT_FOUND,
    "Event not found"
  );

  return event;

};

//event Response logic

export const createOrUpdateEventResponse = async (
  userId: string, 
  userEmail: string,
  data: CreateEventResponseInput
) => {
  // Verify event exists
  const event = await EventModel.findById(data.eventId);
  appAssert(event, NOT_FOUND, "Event not found");

  // Verify user exists
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check if this is an update to an existing response
  const existingResponse = await EventResponseModel.findOne({
    eventId: data.eventId,
    userId
  });
  
  const isUpdate = !!existingResponse;

  // STEP 1: Process voting categories
  // This will store all user suggestions by category - ONLY user-added ones
  const suggestedOptions: Record<string, string[]> = {};
  
  // First, find and handle the date and place categories
  let dateCategory = event.votingCategories.find(cat => cat.categoryName === "date");
  let placeCategory = event.votingCategories.find(cat => cat.categoryName === "place");

  // Helper function to check if an option is user-added (not present in original field options)
  function isUserAddedOption(optionName: string, originalField: any): boolean {
    if (!originalField || !originalField.options) {
      return true; // If we can't find the original field or it has no options, consider it user-added
    }
    
    // Check if this option exists in the original field options
    return !originalField.options.some((opt: any) => 
      opt.label.toLowerCase() === optionName.toLowerCase()
    );
  }

  // Handle dates
  if (dateCategory) {
    // Remove user's previous votes from ALL date options
    dateCategory.options.forEach(option => {
      const index = option.votes.findIndex(id => id.equals(userObjectId));
      if (index !== -1) {
        option.votes.splice(index, 1);
      }
    });
    
    // Add new votes for selected dates
    data.selectedDates.forEach(dateStr => {
      const option = dateCategory!.options.find(opt => opt.optionName === dateStr);
      if (option) {
        option.votes.push(userObjectId);
      }
    });
    
    // Add suggested dates if they don't exist yet
    if (Array.isArray(data.suggestedDates) && data.suggestedDates.length > 0 && event.eventDates.allowUserAdd) {
      for (const dateStr of data.suggestedDates) {
        // Add to event category if it doesn't exist
        const exists = dateCategory.options.some(opt => opt.optionName === dateStr);
        if (!exists) {
          dateCategory.options.push({
            optionName: dateStr,
            votes: data.selectedDates.includes(dateStr) ? [userObjectId] : []
          });
        }
      }
    }
  } else if ((Array.isArray(data.suggestedDates) && data.suggestedDates.length > 0) || data.selectedDates.length) {
    // Create date category if it doesn't exist
    const newDateCategory = {
      categoryName: "date",
      options: [
        // Create options from all dates
        ...[...data.selectedDates, ...(Array.isArray(data.suggestedDates) ? data.suggestedDates : [])]
          .filter((date, index, self) => self.indexOf(date) === index) // Remove duplicates
          .map(date => ({
            optionName: date,
            votes: data.selectedDates.includes(date) ? [userObjectId] : []
          }))
      ]
    };
    
    event.votingCategories.push(newDateCategory);
  }

  // Handle places
  if (placeCategory) {
    // Remove user's previous votes from ALL place options
    placeCategory.options.forEach(option => {
      const index = option.votes.findIndex(id => id.equals(userObjectId));
      if (index !== -1) {
        option.votes.splice(index, 1);
      }
    });
    
    // Add new votes
    data.selectedPlaces.forEach(place => {
      const option = placeCategory!.options.find(opt => opt.optionName === place);
      if (option) {
        option.votes.push(userObjectId);
      }
    });
    
    // Add suggested places if they don't exist yet
    if (Array.isArray(data.suggestedPlaces) && data.suggestedPlaces.length > 0 && event.eventPlaces.allowUserAdd) {
      for (const place of data.suggestedPlaces) {
        // Add to event category if it doesn't exist
        const exists = placeCategory.options.some(opt => opt.optionName === place);
        if (!exists) {
          placeCategory.options.push({
            optionName: place,
            votes: data.selectedPlaces.includes(place) ? [userObjectId] : []
          });
        }
      }
    }
  } else if ((Array.isArray(data.suggestedPlaces) && data.suggestedPlaces.length > 0) || data.selectedPlaces.length) {
    // Create place category if it doesn't exist
    const newPlaceCategory = {
      categoryName: "place",
      options: [
        // Create options from all places
        ...[...data.selectedPlaces, ...(Array.isArray(data.suggestedPlaces) ? data.suggestedPlaces : [])]
          .filter((place, index, self) => self.indexOf(place) === index) // Remove duplicates
          .map(place => ({
            optionName: place,
            votes: data.selectedPlaces.includes(place) ? [userObjectId] : []
          }))
      ]
    };
    
    event.votingCategories.push(newPlaceCategory);
  }

  // Process other voting categories (from custom fields)
  for (const responseCategory of data.votingCategories) {
    // Skip date and place categories as we already handled them
    if (responseCategory.categoryName === "date" || responseCategory.categoryName === "place") {
      continue;
    }
    
    // Find matching category in the event
    let eventCategory = event.votingCategories.find(
      cat => cat.categoryName === responseCategory.categoryName
    );

    if (!eventCategory) {
      // If the category doesn't exist in the event, add it (for custom fields)
      eventCategory = {
        categoryName: responseCategory.categoryName,
        options: []
      };
      event.votingCategories.push(eventCategory);
    }

    // Track only user-added options for this category
    const categoryUserOptions: string[] = [];

    // Find the field definition from customFields
    let fieldId = '';
    let originalField: any = undefined;
    
    // Find the field by looking for matching title
    for (const [key, field] of Object.entries(event.customFields || {})) {
      if (field.title === responseCategory.categoryName) {
        fieldId = key;
        originalField = field;
        break;
      }
    }
    
    // FIRST REMOVE USER'S VOTES FROM ALL OPTIONS IN THIS CATEGORY
    eventCategory.options.forEach(option => {
      const index = option.votes.findIndex(id => id.equals(userObjectId));
      if (index !== -1) {
        option.votes.splice(index, 1);
      }
    });
    
    // Process each option in the response
    for (const responseOption of responseCategory.options) {
      // Skip empty option names
      if (!responseOption.optionName) continue;
      
      // Check if this option exists in the event's voting category
      const optionExists = eventCategory.options.some(opt => 
        opt.optionName.toLowerCase() === responseOption.optionName.toLowerCase()
      );
      
      // Check if this option is user-added
      const isUserOption = isUserAddedOption(responseOption.optionName, originalField);
      
      // If it doesn't exist in the event category yet, add it
      if (!optionExists) {
        // Add to event category
        eventCategory.options.push({
          optionName: responseOption.optionName,
          votes: [] // Start with empty votes, we'll update them below
        });
      }
      
      // If it's a user-added option, store it (avoiding duplicates)
      if (isUserOption && !categoryUserOptions.includes(responseOption.optionName)) {
        categoryUserOptions.push(responseOption.optionName);
      }
      
      // If this option has the user's vote, add it
      if (responseOption.votes.includes(userId)) {
        const eventOption = eventCategory.options.find(
          opt => opt.optionName.toLowerCase() === responseOption.optionName.toLowerCase()
        );

        if (eventOption) {
          // Add user to votes if not already there
          if (!eventOption.votes.some(id => id.equals(userObjectId))) {
            eventOption.votes.push(userObjectId);
          }
        }
      }
    }

    // If we found user-suggested options, add them to the suggestedOptions object
    if (categoryUserOptions.length > 0) {
      // Use the fieldId when available, otherwise fall back to categoryName
      const key = fieldId;
      suggestedOptions[key] = categoryUserOptions;
    }
  }

  // Save the updated event with voting information
  await event.save();

  // STEP 2: Handle the field responses in the EventResponse collection
  
  // Convert from customFields to fieldResponses format
  const fieldResponses = Object.entries(data.customFields || {}).map(([fieldId, value]) => {
    // Find the field definition to determine type - using .get() for Map access
    const fieldDef = event.customFields?.get(fieldId);
    const type = fieldDef?.type || 'text';
    
    return {
      fieldId,
      type,
      response: value
    };
  }).filter(field => 
    // Filter out empty responses unless they're for voting fields (which are stored in the Event)
    field.response !== undefined && field.response !== null && 
    (field.type === 'text' || 
     (field.type === 'list' && Array.isArray(field.response) && field.response.length > 0))
  );

  // Prepare the response data with the new structure
  const responseData = {
    eventId: new mongoose.Types.ObjectId(data.eventId),
    userId: userObjectId,
    userEmail,
    fieldResponses,
    suggestedDates: Array.isArray(data.suggestedDates) ? data.suggestedDates : [],
    suggestedPlaces: Array.isArray(data.suggestedPlaces) ? data.suggestedPlaces : [],
    suggestedOptions: data.suggestedOptions,
  };

  let response;
  if (existingResponse) {
    // Update existing response
    response = await EventResponseModel.findByIdAndUpdate(
      existingResponse._id,
      responseData,
      { new: true }
    );
  } else {
    // Create new response
    response = await EventResponseModel.create(responseData);
  }

  return {
    response,
    event,
    isUpdate
  };
};

export const getUserEventResponse = async (eventId: string, userId: string) => {
  // Get the event to access voting information
  const event = await EventModel.findById(eventId);
  appAssert(event, NOT_FOUND, "Event not found");

  // Get the user's field responses and suggested options
  const response = await EventResponseModel.findOne({ 
    eventId, 
    userId 
  });

  // Extract user's votes from the event's voting categories
  const userVotes: Record<string, string[]> = {};
  const userObjectId = new mongoose.Types.ObjectId(userId);

  event.votingCategories.forEach(category => {
    // Initialize array for this category
    userVotes[category.categoryName] = [];
    
    // Extract options this user voted for
    category.options.forEach(option => {
      // Check if user voted for this option
      if (option.votes.some(id => id.equals(userObjectId))) {
        userVotes[category.categoryName].push(option.optionName);
      }
    });
  });

  return {
    fieldResponses: response?.fieldResponses || [],
    userVotes,
    userAddedOptions: response?.suggestedOptions || {},
    userSuggestedDates: response?.suggestedDates || [],
    userSuggestedPlaces: response?.suggestedPlaces || [],
    hasResponse: !!response
  };
};

export const getEventResponses = async (eventId: string) => {
  const event = await EventModel.findById(eventId)
    .populate({
      path: 'votingCategories.options.votes',
      select: 'email name'
    });
  
  appAssert(event, NOT_FOUND, "Event not found");

  const responses = await EventResponseModel.find({ eventId })
    .populate('userId', 'email name')
    .sort({ createdAt: -1 });

  return {
    event,
    responses
  };
};


//fetch other user responses

export const getOtherUserResponses = async (eventId: string, currentUserId: string) => {
  // Verify event exists
  const event = await EventModel.findById(eventId);
  appAssert(event, NOT_FOUND, "Event not found");

  // Get all responses for this event except the current user's
  const otherResponses = await EventResponseModel.find({
    eventId,
    userId: { $ne: new mongoose.Types.ObjectId(currentUserId) }
  }).populate('userId', 'email name');

  // Get current user's response for filtering
  const currentUserResponse = await EventResponseModel.findOne({
    eventId,
    userId: currentUserId
  });

  // Extract unique suggestions from all responses
  const uniqueSuggestions = {
    dates: new Set<string>(),
    places: new Set<string>(),
    customFields: {} as Record<string, Set<string>>
  };

  // Filter function to check if a suggestion already exists in user's response
  const isUniqueDate = (date: string) => {
    if (!currentUserResponse || !currentUserResponse.suggestedDates.includes(date)) {
      if (event.eventDates?.dates && !event.eventDates.dates.includes(date)) {
        return true;
      }
    }
    return false;
  };

  const isUniquePlace = (place: string) => {
    if (!currentUserResponse || !currentUserResponse.suggestedPlaces.includes(place)) {
      if (event.eventPlaces?.places && !event.eventPlaces.places.includes(place)) {
        return true;
      }
    }
    return false;
  };

  // Define the interface for field options
  interface FieldOption {
    id: number;
    label: string;
  }

  // Process all other users' responses
  otherResponses.forEach(response => {
    // Process dates
    response.suggestedDates.forEach(date => {
      if (isUniqueDate(date)) {
        uniqueSuggestions.dates.add(date);
      }
    });

    // Process places
    response.suggestedPlaces.forEach(place => {
      if (isUniquePlace(place)) {
        uniqueSuggestions.places.add(place);
      }
    });

    // Process custom field responses for list type
    response.fieldResponses.forEach(fieldResponse => {
      const { fieldId, type, response: fieldValue } = fieldResponse;
      
      // Only process relevant field types
      if (type === 'list' && Array.isArray(fieldValue)) {
        if (!uniqueSuggestions.customFields[fieldId]) {
          uniqueSuggestions.customFields[fieldId] = new Set<string>();
        }
        
        // Add each unique list item
        fieldValue.forEach(value => {
          if (typeof value === 'string' && value.trim() !== '') {
            // Check if this value is unique compared to current user's response
            let isUnique = true;
            
            if (currentUserResponse) {
              const userFieldResponse = currentUserResponse.fieldResponses.find(fr => fr.fieldId === fieldId);
              if (userFieldResponse && Array.isArray(userFieldResponse.response)) {
                if (userFieldResponse.response.includes(value)) {
                  isUnique = false;
                }
              }
            }
            
            if (isUnique) {
              uniqueSuggestions.customFields[fieldId].add(value);
            }
          }
        });
      }
    });

    // Process suggested options from other users (for radio and checkbox fields)
    // We need a different approach since suggestedOptions isn't a regular object
    if (response.suggestedOptions) {
      // Get just the JSON data of suggestedOptions to avoid Mongoose internal properties
      try {
        // Try to get the data as a plain object
        const plainObj = JSON.parse(JSON.stringify(response.suggestedOptions));
        
        // Process each field ID
        for (const fieldId in plainObj) {
          // Skip date and place categories
          if (fieldId === 'date' || fieldId === 'place') continue;
          
          // Ensure this is a real field ID in our event
          if (event.customFields && event.customFields.has(fieldId)) {
            const options = plainObj[fieldId];
            
            // Initialize set for this field if needed
            if (!uniqueSuggestions.customFields[fieldId]) {
              uniqueSuggestions.customFields[fieldId] = new Set<string>();
            }
            
            // Process each option
            if (Array.isArray(options)) {
              options.forEach(option => {
                if (typeof option === 'string' && option.trim()) {
                  // Check if option is already in user's suggestions
                  let alreadyInUserSuggestions = false;
                  if (currentUserResponse?.suggestedOptions) {
                    const userSuggestions = JSON.parse(JSON.stringify(currentUserResponse.suggestedOptions));
                    if (userSuggestions[fieldId] && Array.isArray(userSuggestions[fieldId])) {
                      alreadyInUserSuggestions = userSuggestions[fieldId].includes(option);
                    }
                  }
                  
                  // Check if option is an original field option
                  const fieldDef = event.customFields.get(fieldId);
                  let isOriginalOption = false;
                  if (fieldDef?.options && Array.isArray(fieldDef.options)) {
                    isOriginalOption = fieldDef.options.some((opt: FieldOption) => opt.label === option);
                  }
                  
                  // Add if it's a unique user suggestion
                  if (!alreadyInUserSuggestions && !isOriginalOption) {
                    uniqueSuggestions.customFields[fieldId].add(option);
                  }
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error processing suggestedOptions:', error);
      }
    }
  });

  // Convert Sets to arrays for the response
  return {
    event: {
      _id: event._id,
      name: event.name,
      description: event.description
    },
    uniqueSuggestions: {
      dates: Array.from(uniqueSuggestions.dates),
      places: Array.from(uniqueSuggestions.places),
      customFields: Object.fromEntries(
        Object.entries(uniqueSuggestions.customFields).map(([key, valueSet]) => 
          [key, Array.from(valueSet)]
        )
      )
    }
  };
};


/**
 * Get events created by a specific user with response count
 */
export const getUserCreatedEvents = async (userId: string) => {
  // Verify user exists
  const userExists = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(userId)
  });
  
  appAssert(
    userExists,
    NOT_FOUND,
    "User not found"
  );

  // Find all events created by the user
  const events = await EventModel.find({ 
    createdBy: new mongoose.Types.ObjectId(userId) 
  }).sort({ createdAt: -1 });

  // For each event, count responses (excluding the creator)
  const eventsWithResponseCounts = await Promise.all(events.map(async (event) => {
    const responseCount = await EventResponseModel.countDocuments({ 
      eventId: event._id,
      userId: { $ne: new mongoose.Types.ObjectId(userId) } // Exclude creator's responses
    });

    // Convert to plain object so we can add the response count
    const eventObj = event.toObject();
    return {
      ...eventObj,
      otherResponsesCount: responseCount
    };
  }));

  return eventsWithResponseCounts;
};

/**
 * Get events that a user has responded to
 */
export const getUserRespondedEvents = async (userId: string) => {
  // Verify user exists
  const userExists = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(userId)
  });
  
  appAssert(
    userExists,
    NOT_FOUND,
    "User not found"
  );

  // Find all event responses by this user
  const responses = await EventResponseModel.find({ 
    userId: new mongoose.Types.ObjectId(userId) 
  });
  
  // Extract the eventIds
  const eventIds = responses.map(response => response.eventId);
  
  // Fetch the actual events
  const events = await EventModel.find({ 
    _id: { $in: eventIds } 
  }).sort({ createdAt: -1 });

  // For each event, count responses (excluding the current user)
  const eventsWithResponseCounts = await Promise.all(events.map(async (event) => {
    const responseCount = await EventResponseModel.countDocuments({ 
      eventId: event._id,
      userId: { $ne: new mongoose.Types.ObjectId(userId) } // Exclude current user's response
    });

    // Convert to plain object so we can add the response count
    const eventObj = event.toObject();
    return {
      ...eventObj,
      otherResponsesCount: responseCount
    };
  }));

  return eventsWithResponseCounts;
};


/**
 * Updates an event response and sends notifications about new options
 * This function wraps createOrUpdateEventResponse to preserve its original behavior
 * while adding notification capabilities
 */
export const updateEventResponseWithNotifications = async (
  userId: string,
  userEmail: string,
  data: CreateEventResponseInput
) => {
  try {
    // Get the current event state before updating
    const event = await EventModel.findById(data.eventId);
    if (!event) {
      appAssert(false, NOT_FOUND, "Event not found");
      return; // This line won't execute due to appAssert, but TypeScript doesn't know that
    }

    // Clone the original event for comparison
    const originalEventState = JSON.parse(JSON.stringify(event));

    // Call the existing function to update the event
    const result = await createOrUpdateEventResponse(userId, userEmail, data);

    // Define interfaces for type safety
    interface VotingOption {
      optionName: string;
      votes: mongoose.Types.ObjectId[];
      _id?: string;
    }

    interface VotingCategory {
      categoryName: string;
      options: VotingOption[];
      _id?: string;
    }

    // Track new options for each category
    const newOptions: Record<string, string[]> = {};

    // Get the updated event
    const updatedEvent = result.event;

    // Check date options
    const currentDateCategory = updatedEvent.votingCategories.find(cat => cat.categoryName === "date");
    const previousDateCategory = originalEventState.votingCategories.find(
      (cat: VotingCategory) => cat.categoryName === "date"
    );
    
    if (currentDateCategory && previousDateCategory) {
      const currentDateOptions = currentDateCategory.options.map(opt => opt.optionName);
      const previousDateOptions = previousDateCategory.options.map(
        (opt: VotingOption) => opt.optionName
      );
      
      const newDateOptions = currentDateOptions.filter(opt => !previousDateOptions.includes(opt));
      
      if (newDateOptions.length > 0) {
        newOptions["Event Dates"] = newDateOptions;
      }
    }

    // Check place options
    const currentPlaceCategory = updatedEvent.votingCategories.find(cat => cat.categoryName === "place");
    const previousPlaceCategory = originalEventState.votingCategories.find(
      (cat: VotingCategory) => cat.categoryName === "place"
    );
    
    if (currentPlaceCategory && previousPlaceCategory) {
      const currentPlaceOptions = currentPlaceCategory.options.map(opt => opt.optionName);
      const previousPlaceOptions = previousPlaceCategory.options.map(
        (opt: VotingOption) => opt.optionName
      );
      
      const newPlaceOptions = currentPlaceOptions.filter(opt => !previousPlaceOptions.includes(opt));
      
      if (newPlaceOptions.length > 0) {
        newOptions["Event Locations"] = newPlaceOptions;
      }
    }

    // Check all other voting categories
    for (const currentCategory of updatedEvent.votingCategories) {
      // Skip date and place categories as we already handled them
      if (currentCategory.categoryName === "date" || currentCategory.categoryName === "place") {
        continue;
      }
      
      // Find matching category in previous state
      const previousCategory = originalEventState.votingCategories.find(
        (cat: VotingCategory) => cat.categoryName === currentCategory.categoryName
      );
      
      // If category is new, all options are new
      if (!previousCategory) {
        const categoryOptions = currentCategory.options.map(opt => opt.optionName);
        if (categoryOptions.length > 0) {
          newOptions[currentCategory.categoryName] = categoryOptions;
        }
        continue;
      }
      
      // Compare options
      const currentOptions = currentCategory.options.map(opt => opt.optionName);
      const previousOptions = previousCategory.options.map(
        (opt: VotingOption) => opt.optionName
      );
      
      const newCategoryOptions = currentOptions.filter(opt => !previousOptions.includes(opt));
      
      if (newCategoryOptions.length > 0) {
        newOptions[currentCategory.categoryName] = newCategoryOptions;
      }
    }

    // If no new options were detected, return
    if (Object.keys(newOptions).length === 0) {
      return result;
    }

    // Get all users who have responded to this event (excluding the current user)
    const otherResponders = await EventResponseModel.find({
      eventId: new mongoose.Types.ObjectId(data.eventId),
      userId: { $ne: new mongoose.Types.ObjectId(userId) }
    }).distinct('userEmail');
    
    if (otherResponders.length === 0) {
      return result;
    }

    // Create the event URL
    const eventUrl = `${APP_ORIGIN}/event/submit/${updatedEvent.eventUUID}`;
    
    // Send notification emails in the background (don't wait)
    Promise.all(otherResponders.map(async (responderEmail) => {
      try {
        const { data, error } = await sendMail({
          to: responderEmail,
          ...getNewOptionsAddedTemplate(updatedEvent.name, eventUrl, newOptions)
        });
        
        if (error) {
          console.error(`Error sending notification to ${responderEmail}:`, error);
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${responderEmail}:`, emailError);
      }
    }))
    .then(() => {
      console.log(`Sent new options notifications to ${otherResponders.length} users`);
    })
    .catch((error) => {
      console.error('Error sending notification emails:', error);
    });

    // Return the original result from createOrUpdateEventResponse
    return result;
  } catch (error) {
    console.error('Error in updateEventResponseWithNotifications:', error);
    throw error; // Re-throw to let error handler deal with it
  }
};


/**
 * Get event details for owner editing
 */
export const getEventForOwner = async (eventId: string, userId: string) => {
  // Verify user exists
  const userExists = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(userId)
  });
  
  appAssert(userExists, NOT_FOUND, "User not found");

  // Find the event and make sure this user is the owner
  const event = await EventModel.findById(eventId);
  appAssert(event, NOT_FOUND, "Event not found");
  
  // Verify this user is the event creator
  appAssert(
    event.createdBy.equals(new mongoose.Types.ObjectId(userId)),
    FORBIDDEN,
    "Only the event creator can edit this event"
  );

  // Get all responses for this event
  const responses = await EventResponseModel.find({ eventId })
    .populate('userId', 'email name')
    .sort({ createdAt: -1 });
  
  // Create charts data structure
  const chartsData = event.votingCategories.map(category => {
    return {
      categoryName: category.categoryName,
      options: category.options.map(option => ({
        optionName: option.optionName,
        voteCount: option.votes.length,
        voters: option.votes,
        addedBy: option.addedBy || null
      }))
    };
  });

  return {
    event,
    responses,
    chartsData
  };
};

/**
 * Check if an event is still accepting responses based on its ID
 * @param eventId The ID of the event to check
 * @returns The event object if it's accepting responses
 * @throws AppError if event doesn't exist or is not accepting responses
 */
export const verifyEventAcceptsResponses = async (eventId: string): Promise<EventDocument> => {
  // Find the event by ID
  const event = await EventModel.findById(eventId);
  appAssert(event, NOT_FOUND, "Event not found");
  
  // Check if event is accepting responses
  const isAcceptingResponses = event.status === 'open';
  
  // If not accepting responses, throw appropriate error
  if (!isAcceptingResponses) {
    const errorMessage = event.status === 'closed' 
      ? "This event is closed and no longer accepting responses" 
      : "This event has been finalized and no further changes can be made";
    
    appAssert(false, FORBIDDEN, errorMessage);
  }
  
  // Return the event if it's accepting responses
  return event;
};