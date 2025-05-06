import mongoose from "mongoose";
import { INTERNAL_SERVER_ERROR, BAD_REQUEST, UNAUTHORIZED, NOT_FOUND } from "../constants/http";

import EventModel from "../models/event.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { CreateEventInput, createEventSchema } from "../controllers/event.schemas";
import EventResponseModel from "../models/eventResponse.model";
import { CreateEventResponseInput } from "../controllers/eventResponse.schemas";

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
/**
 * Creates a new event with the provided data
 */
function isUserAddedOption(optionName: string, originalField: CustomField | undefined): boolean {
  if (!originalField || !originalField.options) {
    return true; // If we can't find the original field or it has no options, consider it user-added
  }
  
  // Check if this option exists in the original field options
  return !originalField.options.some((opt: CustomFieldOption) => 
    opt.label.toLowerCase() === optionName.toLowerCase()
  );
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

    // Create the event document without explicitly setting eventUUID
    // The model will handle generating a unique eventUUID through its default or middleware
    const event = await EventModel.create({
      name: data.name,
      description: data.description,
      createdBy: new mongoose.Types.ObjectId(data.createdBy),
      customFields: customFieldsMap,
      place: null, // Default place to null as per model
      eventDate: null, // Default eventDate to null
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

  // Handle dates
  if (dateCategory) {
    // Remove user's previous votes
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
    // Remove user's previous votes
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
    let originalField: CustomField | undefined;
    
    // Find the field by looking for matching title
    for (const [key, field] of Object.entries(event.customFields || {})) {
      if (field.title === responseCategory.categoryName) {
        fieldId = key;
        originalField = field as CustomField;
        break;
      }
    }
    
    // Process each option in the response
    for (const responseOption of responseCategory.options) {
      // Skip empty option names
      if (!responseOption.optionName) continue;
      
      // Check if this option exists in the event's voting category
      const optionExists = eventCategory.options.some(opt => 
        opt.optionName === responseOption.optionName
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
    }

    // If we found user-suggested options, add them to the suggestedOptions object
    if (categoryUserOptions.length > 0) {
      // Use the fieldId when available, otherwise fall back to categoryName
      const key = fieldId;
      suggestedOptions[key] = categoryUserOptions;
    }

    // Now handle the voting - first remove this user from all options in this category
    eventCategory.options.forEach(option => {
      const index = option.votes.findIndex(id => id.equals(userObjectId));
      if (index !== -1) {
        option.votes.splice(index, 1);
      }
    });

    // Then add user to the options they voted for
    for (const responseOption of responseCategory.options) {
      if (responseOption.votes.includes(userId)) {
        const eventOption = eventCategory.options.find(
          opt => opt.optionName === responseOption.optionName
        );

        if (eventOption) {
          // Add user to votes if not already there
          if (!eventOption.votes.some(id => id.equals(userObjectId))) {
            eventOption.votes.push(userObjectId);
          }
        }
      }
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
    suggestedOptions: data.suggestedOptions || {},
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

    // Process custom field responses
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

    // Process suggested options from other users (for voting categories)
    if (response.suggestedOptions) {
      for (const [categoryKey, options] of Object.entries(response.suggestedOptions)) {
        if (Array.isArray(options)) {
          // Skip date and place categories as they're already processed
          if (categoryKey === 'date' || categoryKey === 'place') continue;
          
          // IMPORTANT: This section needs to properly identify field keys
          // Find the correct field key for this category
          let fieldKeyToUse = categoryKey;
          
          // If categoryKey is not a direct field key, try to find the matching field
          if (!uniqueSuggestions.customFields[categoryKey]) {
            // Look through event.customFields to find field with matching title
            for (const [fieldKey, fieldValue] of event.customFields.entries()) {
              if (fieldValue.title === categoryKey) {
                fieldKeyToUse = fieldKey;
                break;
              }
            }
          }
          
          // Initialize set for this field if needed
          if (!uniqueSuggestions.customFields[fieldKeyToUse]) {
            uniqueSuggestions.customFields[fieldKeyToUse] = new Set<string>();
          }
          
          options.forEach(option => {
            if (typeof option === 'string' && option.trim() !== '') {
              // Check if this option is unique compared to current user's response
              let isUnique = true;
              
              if (currentUserResponse && currentUserResponse.suggestedOptions) {
                const userOptions = currentUserResponse.suggestedOptions[categoryKey];
                if (Array.isArray(userOptions) && userOptions.includes(option)) {
                  isUnique = false;
                }
              }
              
              // Check if option already exists in voting categories
              const categoryExists = event.votingCategories.some(cat => 
                cat.categoryName === categoryKey && 
                cat.options.some(opt => opt.optionName === option)
              );
              
              if (isUnique && !categoryExists) {
                uniqueSuggestions.customFields[fieldKeyToUse].add(option);
              }
            }
          });
        }
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