import mongoose from "mongoose";
import { INTERNAL_SERVER_ERROR, BAD_REQUEST, UNAUTHORIZED, NOT_FOUND } from "../constants/http";

import EventModel from "../models/event.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { CreateEventInput, createEventSchema } from "../controllers/event.schemas";

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

  return {
    event
  };
};