import mongoose from "mongoose";
import { INTERNAL_SERVER_ERROR, BAD_REQUEST, UNAUTHORIZED, NOT_FOUND } from "../constants/http";

import EventModel from "../models/event.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { CreateEventInput, createEventSchema } from "../controllers/event.schemas";
import EventResponseModel from "../models/eventResponse.model";
import { CreateEventResponseInput } from "../controllers/eventResponse.schemas";

/**
 * Creates a new event with the provided data
 */
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
    if (data.suggestedDates?.length && event.eventDates.allowUserAdd) {
      for (const dateStr of data.suggestedDates) {
        const exists = dateCategory.options.some(opt => opt.optionName === dateStr);
        if (!exists) {
          dateCategory.options.push({
            optionName: dateStr,
            votes: data.selectedDates.includes(dateStr) ? [userObjectId] : [],
            addedBy: userObjectId // Track who added this date
          });
        }
      }
    }
  } else if (data.suggestedDates?.length || data.selectedDates.length) {
    // Create date category if it doesn't exist
    const newDateCategory = {
      categoryName: "date",
      options: [
        // Create options from selected dates
        ...data.selectedDates.map(date => ({
          optionName: date,
          votes: [userObjectId],
          addedBy: userObjectId // Track who added this date
        })),
        // Create options from suggested dates (if not already in selected)
        ...(data.suggestedDates || [])
          .filter(date => !data.selectedDates.includes(date))
          .map(date => ({
            optionName: date,
            votes: [],
            addedBy: userObjectId // Track who added this date
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
    if (data.suggestedPlaces?.length && event.eventPlaces.allowUserAdd) {
      for (const place of data.suggestedPlaces) {
        const exists = placeCategory.options.some(opt => opt.optionName === place);
        if (!exists) {
          placeCategory.options.push({
            optionName: place,
            votes: data.selectedPlaces.includes(place) ? [userObjectId] : [],
            addedBy: userObjectId // Track who added this place
          });
        }
      }
    }
  } else if (data.suggestedPlaces?.length || data.selectedPlaces.length) {
    // Create place category if it doesn't exist
    const newPlaceCategory = {
      categoryName: "place",
      options: [
        // Create options from selected places
        ...data.selectedPlaces.map(place => ({
          optionName: place,
          votes: [userObjectId],
          addedBy: userObjectId // Track who added this place
        })),
        // Create options from suggested places (if not already in selected)
        ...(data.suggestedPlaces || [])
          .filter(place => !data.selectedPlaces.includes(place))
          .map(place => ({
            optionName: place,
            votes: [],
            addedBy: userObjectId // Track who added this place
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

    // First, add all options from the response that don't exist in the event category yet
    for (const responseOption of responseCategory.options) {
      const optionExists = eventCategory.options.some(opt => 
        opt.optionName === responseOption.optionName
      );
      
      if (!optionExists) {
        // This is a new option (user-added) - add it to the event category
        eventCategory.options.push({
          optionName: responseOption.optionName,
          votes: [], // Start with empty votes, we'll update them below
          addedBy: userObjectId // Track who added this option
        });
      }
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

  // Prepare the response data - only include non-voting field responses
  const responseData = {
    eventId: new mongoose.Types.ObjectId(data.eventId),
    userId: userObjectId,
    userEmail,
    fieldResponses
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

export const getUserEventResponse = async (eventId: string, userId: string) => {
  // Get the event to access voting information
  const event = await EventModel.findById(eventId);
  appAssert(event, NOT_FOUND, "Event not found");

  // Get the user's field responses
  const response = await EventResponseModel.findOne({ 
    eventId, 
    userId 
  });

  // Extract user's votes and added options from the event's voting categories
  const userVotes: Record<string, string[]> = {};
  const userAddedOptions: Record<string, string[]> = {};
  const userSuggestedDates: string[] = [];
  const userSuggestedPlaces: string[] = [];
  const userObjectId = new mongoose.Types.ObjectId(userId);

  event.votingCategories.forEach(category => {
    // Initialize arrays for this category
    userVotes[category.categoryName] = [];
    userAddedOptions[category.categoryName] = [];
    
    // Extract options this user voted for and added
    category.options.forEach(option => {
      // Check if user voted for this option
      if (option.votes.some(id => id.equals(userObjectId))) {
        userVotes[category.categoryName].push(option.optionName);
      }
      
      // Check if user added this option
      if (option.addedBy && option.addedBy.equals(userObjectId)) {
        userAddedOptions[category.categoryName].push(option.optionName);
        
        // Also track as suggested date/place for backward compatibility
        if (category.categoryName === "date") {
          userSuggestedDates.push(option.optionName);
        } else if (category.categoryName === "place") {
          userSuggestedPlaces.push(option.optionName);
        }
      }
    });
  });

  return {
    fieldResponses: response?.fieldResponses || [],
    userVotes,
    userAddedOptions,
    userSuggestedDates,
    userSuggestedPlaces,
    hasResponse: !!response
  };
};