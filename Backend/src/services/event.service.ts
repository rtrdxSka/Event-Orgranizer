import mongoose from "mongoose";
import { INTERNAL_SERVER_ERROR, BAD_REQUEST, UNAUTHORIZED, NOT_FOUND, FORBIDDEN } from "../constants/http";

import EventModel, { EventDocument } from "../models/event.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { CreateEventInput, createEventSchema } from "../validations/event.schemas";
import EventResponseModel from "../models/eventResponse.model";
import { CreateEventResponseInput } from "../validations/eventResponse.schemas";

import { sendMail } from "../utils/sendMail";
import { getEventFinalizedTemplate, getNewOptionsAddedTemplate } from "../utils/emailTemplates";
import { APP_ORIGIN } from "../constants/env";
import FinalizedEventModel from "../models/FinalizedEvent";
import { validateEventResponseDataOrThrow } from "../validations/eventResponse.validation";
import { validateAndConvertCustomFields } from "../validations/customFieldValidation";
import { finalizeEventRequestSchema } from "../validations/eventFinalize.schemas";

interface CustomFieldOption {
  id: number;
  label: string;
  checked?: boolean;
}

interface FinalizationSelections {
  date: string | null;
  place: string | null;
  customFields: Record<string, any>;
}

// Define interfaces for voter details
interface VoterDetail {
  optionName: string;
  voters: mongoose.Types.ObjectId[];
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
    const customFieldsMap = data.customFields 
      ? validateAndConvertCustomFields(data.customFields)
      : new Map();

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

  validateEventResponseDataOrThrow(data, event);

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
      const option = placeCategory!.options.find(opt => opt.optionName.toLowerCase() === place.toLowerCase());
      if (option) {
        option.votes.push(userObjectId);
      }
    });
    
    // Add suggested places if they don't exist yet
    if (Array.isArray(data.suggestedPlaces) && data.suggestedPlaces.length > 0 && event.eventPlaces.allowUserAdd) {
      for (const place of data.suggestedPlaces) {
        // Add to event category if it doesn't exist
        const exists = placeCategory.options.some(opt => opt.optionName.toLowerCase() === place.toLowerCase());
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
      cat => cat.categoryName.toLowerCase() === responseCategory.categoryName.toLowerCase()
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
// Define types for the chart data
interface ChartOptionData {
  optionName: string;
  voteCount: number;
  voters: mongoose.Types.ObjectId[];
  voterDetails?: Array<{ _id: string; email: string; name?: string }>;
  addedBy?: mongoose.Types.ObjectId | null;
  isOriginal?: boolean;
}

interface CategoryChartData {
  categoryName: string;
  options: ChartOptionData[];
}

interface ListFieldChartData {
  fieldId: string;
  categoryName: string;
  fieldType: 'list';
  options: ChartOptionData[];
}

interface EventOwnerData {
  event: EventDocument;
  responses: any[]; // Using any[] to avoid the type mismatch with Document[]
  chartsData: CategoryChartData[];
  listFieldsData: ListFieldChartData[];
  textFieldsData: TextFieldResponseData[];
}

interface TextFieldResponseData {
  fieldId: string;
  categoryName: string;
  responses: Array<{
    userId: string;
    userEmail: string;
    userName?: string;
    response: string;
  }>;
}

export const getEventForOwner = async (eventId: string, userId: string): Promise<EventOwnerData> => {
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
  
  // Create a voterMap to look up user information
  const voterMap: Record<string, { email: string; name?: string }> = {};
  
  // Populate the voterMap using responses
  responses.forEach(response => {
    // Type assertion to handle the populated userId
    const userInfo = response.userId as unknown as { _id: mongoose.Types.ObjectId; email: string; name?: string };
    
    if (userInfo && userInfo._id) {
      const userIdStr = userInfo._id.toString();
      voterMap[userIdStr] = {
        email: userInfo.email || `User ${userIdStr}`,
        name: userInfo.name
      };
    }
  });
  
  // Create charts data structure for voting categories
  const chartsData: CategoryChartData[] = event.votingCategories.map(category => {
    return {
      categoryName: category.categoryName,
      options: category.options.map(option => {
        // For each vote, create a record with voter info if available
        const voterDetails = option.votes.map(voterId => {
          const voterIdStr = voterId.toString();
          return {
            _id: voterIdStr,
            email: voterMap[voterIdStr]?.email || `User ${voterIdStr}`,
            name: voterMap[voterIdStr]?.name
          };
        });
        
        return {
          optionName: option.optionName,
          voteCount: option.votes.length,
          voters: option.votes, // Keep the original voters array of ObjectIds
          voterDetails, // Add the detailed voter information
          addedBy: option.addedBy || null
        };
      })
    };
  });

  // Process list field responses
  const listFieldsData: ListFieldChartData[] = [];

  const textFieldsData: TextFieldResponseData[] = [];
  
  // Iterate through all custom fields to find list fields
  if (event.customFields) {
    for (const [fieldId, fieldValue] of event.customFields.entries()) {
      const field = fieldValue as any; // Cast to any for easy access to properties
      
      if (field.type === 'list') {
        // Collection for all values from all responses
        const allValues: string[] = [];
        
        // Original field values (pre-filled by event creator)
        const originalValues: string[] = field.values || [];
        
        // Track which values were added by which users
        const valueContributors: Record<string, { ids: string[]; details: Array<{ _id: string; email: string; name?: string }> }> = {};
        
        // Process all responses for this field
        responses.forEach(response => {
          // Find this field in the response's field responses
          const fieldResponse = response.fieldResponses?.find((fr: any) => fr.fieldId === fieldId);
          
          if (fieldResponse && Array.isArray(fieldResponse.response)) {
            // Type assertion for the populated userId
            const userInfo = response.userId as unknown as { _id: mongoose.Types.ObjectId; email: string; name?: string };
            
            if (!userInfo || !userInfo._id) return;
            
            const userIdStr = userInfo._id.toString();
            
            // Add each value to our collection
            fieldResponse.response.forEach((value: string) => {
              if (typeof value === 'string' && value.trim() !== '') {
                allValues.push(value);
                
                // Track who contributed this value
                if (!valueContributors[value]) {
                  valueContributors[value] = { ids: [], details: [] };
                }
                
                if (!valueContributors[value].ids.includes(userIdStr)) {
                  valueContributors[value].ids.push(userIdStr);
                  valueContributors[value].details.push({
                    _id: userIdStr,
                    email: userInfo.email || `User ${userIdStr}`,
                    name: userInfo.name
                  });
                }
              }
            });
          }
        });
        
        // Count occurrences of each value
        const valueCounts: Record<string, number> = {};
        allValues.forEach(value => {
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
        
        // Format data for charts
        const options: ChartOptionData[] = Object.entries(valueCounts).map(([value, count]) => {
          const contributors = valueContributors[value] || { ids: [], details: [] };
          
          return {
            optionName: value,
            voteCount: count,
            voters: contributors.ids.map(id => new mongoose.Types.ObjectId(id)), // Convert strings back to ObjectIds
            voterDetails: contributors.details,
            isOriginal: originalValues.includes(value)
          };
        });

        originalValues.forEach(value => {
  // Skip if already added
  if (!options.some(opt => opt.optionName === value)) {
    options.push({
      optionName: value,
      voteCount: 0,
      voters: [],
      voterDetails: [],
      isOriginal: true
    });
  }
});
        
        // Add to list fields data
        listFieldsData.push({
          fieldId,
          categoryName: field.title,
          fieldType: 'list',
          options
        });
      } else if (field.type === 'text') {
        // Collect all text responses
        const textResponses: Array<{
          userId: string;
          userEmail: string;
          userName?: string;
          response: string;
        }> = [];
        
        // Process all responses for this field
        responses.forEach(response => {
          // Find this field in the response's field responses
          const fieldResponse = response.fieldResponses?.find((fr: any) => fr.fieldId === fieldId);
          
          if (fieldResponse && fieldResponse.response) {
            // Type assertion for the populated userId
            const userInfo = response.userId as unknown as { _id: mongoose.Types.ObjectId; email: string; name?: string };
            
            if (!userInfo || !userInfo._id) return;
            
            const userIdStr = userInfo._id.toString();
            
            // Add this response
            textResponses.push({
              userId: userIdStr,
              userEmail: userInfo.email || `User ${userIdStr}`,
              userName: userInfo.name,
              response: fieldResponse.response
            });
          }
        });
        
        // Only add text fields that have responses
        if (textResponses.length > 0) {
          textFieldsData.push({
            fieldId,
            categoryName: field.title,
            responses: textResponses
          });
        }
      }
    }
  }

  return {
    event,
    responses,
    chartsData,
    listFieldsData,
    textFieldsData
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


//changing event status

/**
 * Close an event - change status from 'open' to 'closed'
 * @param eventId The event ID
 * @param userId The user ID (must be the event creator)
 * @returns The updated event
 */
export const closeEvent = async (eventId: string, userId: string): Promise<EventDocument> => {
  // Verify user exists
  const userExists = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(userId)
  });
  
  appAssert(userExists, NOT_FOUND, "User not found");

  // Find the event
  const event = await EventModel.findById(eventId);
  appAssert(event, NOT_FOUND, "Event not found");
  
  // Verify this user is the event creator
  appAssert(
    event.createdBy.equals(new mongoose.Types.ObjectId(userId)),
    FORBIDDEN,
    "Only the event creator can modify this event"
  );
  
  // Check if event is already closed or finalized
  appAssert(
    event.status === 'open',
    BAD_REQUEST,
    "This event is not in 'open' status and cannot be closed"
  );
  
  // Update status
  event.status = 'closed';
  await event.save();
  
  return event;
};

/**
 * Reopen an event - change status from 'closed' to 'open'
 * @param eventId The event ID
 * @param userId The user ID (must be the event creator)
 * @returns The updated event
 */
export const reopenEvent = async (eventId: string, userId: string): Promise<EventDocument> => {
  // Verify user exists
  const userExists = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(userId)
  });
  
  appAssert(userExists, NOT_FOUND, "User not found");

  // Find the event
  const event = await EventModel.findById(eventId);
  appAssert(event, NOT_FOUND, "Event not found");
  
  // Verify this user is the event creator
  appAssert(
    event.createdBy.equals(new mongoose.Types.ObjectId(userId)),
    FORBIDDEN,
    "Only the event creator can modify this event"
  );
  
  // Check if event is already open or finalized
  appAssert(
    event.status === 'closed',
    BAD_REQUEST,
    "This event is not in 'closed' status and cannot be reopened"
  );
  
  // Update status
  event.status = 'open';
  await event.save();
  
  return event;
};

/**
 * Finalize an event by setting the final date, place, and custom field selections
 */
// In event.service.ts

interface FinalizationSelections {
  date: string | null;
  place: string | null;
  customFields: Record<string, any>;
}

// Define interfaces for voter details
interface VoterDetail {
  optionName: string;
  voters: mongoose.Types.ObjectId[];
}

/**
 * Finalize an event by setting the final date, place, and custom field selections
 */
export const finalizeEvent = async (
  eventId: string, 
  userId: string, 
  selections: FinalizationSelections
): Promise<any> => {
  // Verify user exists
  const userExists = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(userId)
  });
  
  appAssert(userExists, NOT_FOUND, "User not found");

    const validationResult = finalizeEventRequestSchema.safeParse(selections);
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    appAssert(false, BAD_REQUEST, `Invalid request: ${firstError.message} at ${firstError.path.join('.')}`);
  }
  
  const { date, place, customFields } = validationResult.data;

  // Find the event and ensure this user is the owner
  const event = await EventModel.findById(eventId);
  appAssert(event, NOT_FOUND, "Event not found");
  
  // Verify this user is the event creator
  appAssert(
    event.createdBy.equals(new mongoose.Types.ObjectId(userId)),
    FORBIDDEN,
    "Only the event creator can finalize this event"
  );
  
  // Verify event is not already finalized
  appAssert(
    event.status !== 'finalized',
    BAD_REQUEST,
    "Event is already finalized"
  );
  
  // Process customFieldSelections to include voter details
  const customFieldSelections: Record<string, any> = {};
  
  // Define a type guard for non-null VoterDetail
  const isVoterDetail = (item: VoterDetail | null): item is VoterDetail => {
    return item !== null;
  };
  
  // Extract voter details for each selection
  for (const [fieldId, selection] of Object.entries(selections.customFields)) {
    // Find the corresponding voting category for this field
    const categoryName = event.customFields?.get(fieldId)?.title;
    
    if (categoryName) {
      const category = event.votingCategories.find(cat => cat.categoryName === categoryName);
      
      // Extract voter details if this is a voting category
      if (category) {
        let voterDetails: VoterDetail[] = [];
        
        // If selection is an array (checkbox, list), get voters for each option
        if (Array.isArray(selection)) {
          const optionNames = selection;
          voterDetails = optionNames.map(optionName => {
            const option = category.options.find(opt => opt.optionName === optionName);
            return option ? {
              optionName,
              voters: option.votes // These are already ObjectIDs
            } : null;
          }).filter(isVoterDetail); // Use the type guard
        } else {
          // For single selection (radio, text)
          const option = category.options.find(opt => opt.optionName === selection);
          if (option) {
            voterDetails = [{
              optionName: selection,
              voters: option.votes
            }];
          }
        }
        
        customFieldSelections[fieldId] = {
          fieldId,
          fieldType: event.customFields.get(fieldId)?.type || 'unknown',
          fieldTitle: categoryName,
          selection,
          voterDetails
        };
      } else {
        // For non-voting fields (e.g., text fields with direct responses)
        customFieldSelections[fieldId] = {
          fieldId,
          fieldType: event.customFields.get(fieldId)?.type || 'unknown',
          fieldTitle: categoryName,
          selection
        };
      }
    }
  }
  
  // Get voter details for date selection
  let dateVoters: mongoose.Types.ObjectId[] = [];
  if (selections.date) {
    const dateCategory = event.votingCategories.find(cat => cat.categoryName === 'date');
    if (dateCategory) {
      const dateOption = dateCategory.options.find(opt => opt.optionName === selections.date);
      if (dateOption) {
        dateVoters = dateOption.votes;
      }
    }
  }
  
  // Get voter details for place selection
  let placeVoters: mongoose.Types.ObjectId[] = [];
  if (selections.place) {
    const placeCategory = event.votingCategories.find(cat => cat.categoryName === 'place');
    if (placeCategory) {
      const placeOption = placeCategory.options.find(opt => opt.optionName === selections.place);
      if (placeOption) {
        placeVoters = placeOption.votes;
      }
    }
  }
  
  // Create a new finalized event record
  const finalizedEvent = await FinalizedEventModel.create({
    eventId: event._id,
    finalizedDate: selections.date,
    finalizedPlace: selections.place,
    customFieldSelections,
    finalizedBy: new mongoose.Types.ObjectId(userId),
    finalizedAt: new Date()
  });
  
  // Update the original event
  const now = new Date();
  event.status = 'finalized';
  event.eventDate = selections.date ? new Date(selections.date) : null;
  event.place = selections.place;
  await event.save();


  // Send email notifications to all participants
  try {
    // Get all users who have responded to this event
    const participants = await EventResponseModel.find({
      eventId: new mongoose.Types.ObjectId(eventId)
    }).distinct('userEmail');
    
    if (participants.length > 0) {
      // Create the finalized event URL
      const finalizedEventUrl = `${APP_ORIGIN}/event/finalized/${event.eventUUID}`;
      
      // Send notification emails in the background (don't wait)
      Promise.all(participants.map(async (participantEmail) => {
        try {
          const { data, error } = await sendMail({
            to: participantEmail,
            ...getEventFinalizedTemplate(
              event.name,
              selections.date,
              selections.place,
              customFieldSelections,
              finalizedEventUrl
            )
          });
          
          if (error) {
            console.error(`Error sending finalization notification to ${participantEmail}:`, error);
          } else {
            console.log(`Finalization notification sent successfully to ${participantEmail}`);
          }
        } catch (emailError) {
          console.error(`Failed to send finalization email to ${participantEmail}:`, emailError);
        }
      }))
      .then(() => {
        console.log(`Sent finalization notifications to ${participants.length} participants`);
      })
      .catch((error) => {
        console.error('Error sending finalization notification emails:', error);
      });
    }
  } catch (error) {
    // Log the error but don't fail the finalization process
    console.error('Error while sending finalization emails:', error);
  }
  
  // Send notifications to participants (implement later)
  
  return {
    event,
    finalizedEvent
  };
};

export const getFinalizedEventData = async (eventUUID: string) => {
  // Fetch the event by UUID
  const event = await EventModel.findOne({ eventUUID });
  appAssert(event, NOT_FOUND, "Event not found");
  
  // Check if this event is finalized
  appAssert(event.status === 'finalized', BAD_REQUEST, "This event hasn't been finalized yet");
  
  // Get the finalized event details
  const finalizedEvent = await FinalizedEventModel.findOne({ eventId: event._id });
  appAssert(finalizedEvent, NOT_FOUND, "Finalized event data not found");
  
  // Get organizer info
  const organizer = await UserModel.findById(event.createdBy);
  appAssert(organizer, NOT_FOUND, "Event organizer not found");
  
  return {
    event: {
      _id: event._id,
      name: event.name,
      description: event.description,
      eventUUID: event.eventUUID,
      status: event.status,
      createdBy: event.createdBy,
      createdAt: event.createdAt
    },
    finalizedEvent: {
      finalizedDate: finalizedEvent.finalizedDate,
      finalizedPlace: finalizedEvent.finalizedPlace,
      customFieldSelections: finalizedEvent.customFieldSelections,
      finalizedAt: finalizedEvent.finalizedAt,
      finalizedBy: finalizedEvent.finalizedBy
    },
    organizer: {
      email: organizer.email,
    }
  };
};

export const removeEventOption = async (
  eventId: string,
  userId: string,
  categoryName: string,
  optionName: string,
  fieldId?: string
): Promise<any> => {
  console.log(`Removing option "${optionName}" from category "${categoryName}" with fieldId "${fieldId}"`);
  
  // Verify user exists
  const userExists = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(userId)
  });
  
  appAssert(userExists, NOT_FOUND, "User not found");

  // Find the event and ensure this user is the owner
  const event = await EventModel.findById(eventId);
  appAssert(event, NOT_FOUND, "Event not found");
  
  // Verify this user is the event creator
  appAssert(
    event.createdBy.equals(new mongoose.Types.ObjectId(userId)),
    FORBIDDEN,
    "Only the event creator can modify this event"
  );
  
  // Verify event is not finalized
  appAssert(
    event.status !== 'finalized',
    BAD_REQUEST,
    "Event is already finalized and cannot be modified"
  );
  
  // Find the fieldId if not provided (by matching category name with customFields titles)
  let effectiveFieldId = fieldId;
  if (!effectiveFieldId && event.customFields) {
    // Look through all customFields to find a matching title
    for (const [key, field] of event.customFields.entries()) {
      if (field.title === categoryName) {
        effectiveFieldId = key;
        console.log(`Found matching fieldId ${effectiveFieldId} for category ${categoryName}`);
        break;
      }
    }
  }
  
  // Different handling paths based on field type
  let isCustomField = false;
  
  // 1. First, try to update customFields if we have a fieldId
  if (effectiveFieldId && event.customFields && event.customFields.has(effectiveFieldId)) {
    isCustomField = true;
    const customField = event.customFields.get(effectiveFieldId);
    
    // Check if this is a field with options (radio, checkbox)
    if (customField && customField.options && Array.isArray(customField.options)) {
      // Find the option in the field options using case-insensitive comparison
      const fieldOptionIndex = customField.options.findIndex(
        (opt: { label?: string; id?: number }) => opt.label && opt.label.toLowerCase() === optionName.toLowerCase()
      );
      
      // If found, remove it
      if (fieldOptionIndex !== -1) {
        console.log(`Removing option "${optionName}" from customFields[${effectiveFieldId}].options`);
        
        // Make sure there's more than one option for radio/checkbox fields
        appAssert(
          customField.options.length > 1,
          BAD_REQUEST,
          `Cannot remove the only option in field '${categoryName}'`
        );
        
        customField.options.splice(fieldOptionIndex, 1);
        
        // Update the field in the Map
        event.customFields.set(effectiveFieldId, customField);
        
        // Explicitly mark the customFields as modified
        event.markModified(`customFields`);
      } else {
        console.log(`Option "${optionName}" not found in customFields[${effectiveFieldId}].options`);
      }
    } else if (customField && customField.type === 'list' && customField.values && Array.isArray(customField.values)) {
      // For list fields, remove from values array
      const valueIndex = customField.values.findIndex(
        (value: string) => value.toLowerCase() === optionName.toLowerCase()
      );
      
      if (valueIndex !== -1) {
        console.log(`Removing value "${optionName}" from customFields[${effectiveFieldId}].values`);
        
        // Make sure there's more than one value for list fields
        appAssert(
          customField.values.length > 1,
          BAD_REQUEST,
          `Cannot remove the only value in list field '${categoryName}'`
        );
        
        customField.values.splice(valueIndex, 1);
        
        // Update the field in the Map
        event.customFields.set(effectiveFieldId, customField);
        
        // Explicitly mark the customFields as modified
        event.markModified(`customFields`);
      }
    }
  }
  
  // 2. Then, handle date/place categories regardless of custom field processing
  if (categoryName.toLowerCase() === 'date' && event.eventDates && event.eventDates.dates) {
    isCustomField = false; // This is a built-in category
    // Remove from the dates array if it exists there
    const dateIndex = event.eventDates.dates.findIndex(
      (date) => date.toLowerCase() === optionName.toLowerCase()
    );
    
    if (dateIndex !== -1) {
      console.log(`Removing date "${optionName}" from eventDates.dates`);
      
      // Make sure there's more than one date
      appAssert(
        event.eventDates.dates.length > 1,
        BAD_REQUEST,
        `Cannot remove the only date in event date options`
      );
      
      event.eventDates.dates.splice(dateIndex, 1);
      
      // Explicitly mark the eventDates as modified
      event.markModified('eventDates');
    }
  } else if (categoryName.toLowerCase() === 'place' && event.eventPlaces && event.eventPlaces.places) {
    isCustomField = false; // This is a built-in category
    // Remove from the places array if it exists there
    const placeIndex = event.eventPlaces.places.findIndex(
      (place) => place.toLowerCase() === optionName.toLowerCase()
    );
    
    if (placeIndex !== -1) {
      console.log(`Removing place "${optionName}" from eventPlaces.places`);
      
      // Make sure there's more than one place
      appAssert(
        event.eventPlaces.places.length > 1,
        BAD_REQUEST,
        `Cannot remove the only place in event place options`
      );
      
      event.eventPlaces.places.splice(placeIndex, 1);
      
      // Explicitly mark the eventPlaces as modified
      event.markModified('eventPlaces');
    }
  }
  
  // 3. Finally, handle voting categories if not already handled as a custom field
  let affectedUserIds: string[] = [];
  if (!isCustomField) {
    // Find the category
    const categoryIndex = event.votingCategories.findIndex(
      cat => cat.categoryName.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (categoryIndex !== -1) {
      const category = event.votingCategories[categoryIndex];
      
      // Find the option
      const optionIndex = category.options.findIndex(
        opt => opt.optionName.toLowerCase() === optionName.toLowerCase()
      );
      
      if (optionIndex !== -1) {
        // Ensure there will be at least one option left
        appAssert(
          category.options.length > 1,
          BAD_REQUEST,
          `Cannot remove the only option in category '${categoryName}'`
        );
        
        // Get the option to be removed (for tracking affected users)
        const removedOption = category.options[optionIndex];
        affectedUserIds = removedOption.votes.map(userId => userId.toString());
        
        // Remove the option from the category
        category.options.splice(optionIndex, 1);
        
        // Explicitly mark the votingCategories as modified
        event.markModified('votingCategories');
      }
    }
  }
  
  // Save the updated event
  await event.save();
  
  // Update user responses in bulk using MongoDB update operators
  try {
    // For date category
    if (categoryName.toLowerCase() === 'date') {
      await EventResponseModel.updateMany(
        { eventId: new mongoose.Types.ObjectId(eventId) },
        { $pull: { suggestedDates: optionName } }
      );
    }
    // For place category
    else if (categoryName.toLowerCase() === 'place') {
      await EventResponseModel.updateMany(
        { eventId: new mongoose.Types.ObjectId(eventId) },
        { $pull: { suggestedPlaces: optionName } }
      );
    }
    
    // For custom fields with a provided fieldId
    if (effectiveFieldId) {
      // Create a properly typed update query for suggestedOptions
      const suggestedOptionsPath = `suggestedOptions.${effectiveFieldId}`;
      
      // Use MongoDB's updateMany with a properly structured update for suggestedOptions
      await EventResponseModel.updateMany(
        { eventId: new mongoose.Types.ObjectId(eventId) },
        { $pull: { [suggestedOptionsPath]: optionName } }
      );
      
      console.log(`Updated suggestedOptions using path: ${suggestedOptionsPath}`);
      
      // Get the customField to determine its type
      const customField = event.customFields?.get(effectiveFieldId);
      
      if (customField) {
        // For text fields - remove matching responses
        if (customField.type === 'text') {
          await EventResponseModel.updateMany(
            { 
              eventId: new mongoose.Types.ObjectId(eventId),
              "fieldResponses": { 
                $elemMatch: { 
                  fieldId: effectiveFieldId, 
                  type: 'text', 
                  response: optionName 
                } 
              }
            },
            { 
              $pull: { 
                "fieldResponses": { 
                  fieldId: effectiveFieldId, 
                  type: 'text', 
                  response: optionName 
                } 
              } 
            }
          );
          
          console.log(`Removed text responses matching "${optionName}" for field "${effectiveFieldId}"`);
        }
        // For list fields - remove the item from array responses
        else if (customField.type === 'list') {
          // First approach: Find all responses with this field
          const responses = await EventResponseModel.find({
            eventId: new mongoose.Types.ObjectId(eventId),
            "fieldResponses.fieldId": effectiveFieldId,
            "fieldResponses.type": "list"
          });
          
          // Update each response individually to properly handle the array
          for (const response of responses) {
            // Find the specific fieldResponse
            const fieldResponseIndex = response.fieldResponses.findIndex(
              fr => fr.fieldId === effectiveFieldId && fr.type === 'list'
            );
            
            if (fieldResponseIndex !== -1) {
              const fieldResponse = response.fieldResponses[fieldResponseIndex];
              
              // Remove the option from the array if it exists
              if (Array.isArray(fieldResponse.response)) {
                const responseArray = fieldResponse.response;
                const newResponseArray = responseArray.filter(
                  (item) => item !== optionName
                );
                
                // Only update if something changed
                if (newResponseArray.length !== responseArray.length) {
                  response.fieldResponses[fieldResponseIndex].response = newResponseArray;
                  await response.save();
                  console.log(`Removed "${optionName}" from list response for user ${response.userId}`);
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating user responses:', error);
    // Continue execution - don't throw an error here
  }
  
  return {
    event: {
      _id: event._id,
      name: event.name,
      status: event.status
    },
    affectedUsers: affectedUserIds.length
  };
};