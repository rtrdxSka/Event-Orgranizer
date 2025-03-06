import { INTERNAL_SERVER_ERROR, NOT_FOUND, BAD_REQUEST, UNAUTHORIZED } from "../constants/http";
import { createEventSchema, type CreateEventInput } from "../controllers/event.schemas";
import EventModel from "../models/event.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import mongoose from "mongoose";
import { generateEventCode } from "../utils/event";

export const createEvent = async (data: CreateEventInput) => {
  const validationResult = createEventSchema.safeParse(data);
  appAssert(
    validationResult.success,
    BAD_REQUEST,
    validationResult.success ? "" : validationResult.error.message
  );

  const userExists = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(data.createdBy)
  });
 
  appAssert(
    userExists,
    UNAUTHORIZED,
    "UNAUTHORIZED REQUEST"
  );


  const validatedData = validationResult.data;

  interface VotingOption {
    optionName: string;
    votes: mongoose.Types.ObjectId[];
  }

  interface VotingCategory {
    categoryName: string;
    options: VotingOption[];
  }

  // Initialize voting categories array
  const votingCategories: VotingCategory[] = [];

  // Add date voting category from eventDates if available
  if (validatedData.eventDates && validatedData.eventDates.dates && validatedData.eventDates.dates.length > 0) {
    votingCategories.push({
      categoryName: "date",
      options: validatedData.eventDates.dates.map(date => ({
        optionName: date, // The date string is already in ISO format
        votes: []
      }))
    });
  } else if (validatedData.eventDate) {
    // Fallback to the old eventDate field if present
    votingCategories.push({
      categoryName: "date",
      options: [{ 
        optionName: validatedData.eventDate.toISOString(),
        votes: []
      }]
    });
  } else {
    // Add an empty date category if no dates provided
    votingCategories.push({
      categoryName: "date",
      options: []
    });
  }

  // Add place voting category from eventPlaces if available
  if (validatedData.eventPlaces && validatedData.eventPlaces.places && validatedData.eventPlaces.places.length > 0) {
    votingCategories.push({
      categoryName: "place",
      options: validatedData.eventPlaces.places.map(place => ({
        optionName: place,
        votes: []
      }))
    });
  } else if (validatedData.place) {
    // Fallback to the old place field if present
    votingCategories.push({
      categoryName: "place",
      options: [{ 
        optionName: validatedData.place,
        votes: []
      }]
    });
  } else {
    // Add an empty place category if no places provided
    votingCategories.push({
      categoryName: "place",
      options: []
    });
  }

  // Add time category (always empty initially)
  votingCategories.push({
    categoryName: "time",
    options: []
  });

  // Add voting categories for radio and checkbox fields
  if (validatedData.customFields) {
    Object.entries(validatedData.customFields).forEach(([fieldKey, fieldValue]) => {
      if (fieldValue.type === 'radio' || fieldValue.type === 'checkbox') {
        if (fieldValue.options && fieldValue.options.length > 0) {
          votingCategories.push({
            categoryName: fieldValue.title,
            options: fieldValue.options.map(option => ({
              optionName: option.label,
              votes: []
            }))
          });
        }
      }
    });
  }

  // Add any additional voting categories from the request
  if (validatedData.votingCategories) {
    validatedData.votingCategories.forEach(category => {
      // Only add if not already added (avoid duplicates with date/place)
      if (!votingCategories.some(vc => vc.categoryName === category.categoryName)) {
        // Create a new category with properly initialized votes arrays
        votingCategories.push({
          categoryName: category.categoryName,
          options: category.options.map(option => ({
            optionName: option.optionName,
            votes: [] // Initialize with empty array of ObjectIds
          }))
        });
      }
    });
  }

  // Create customFields map if it exists
  let customFields = undefined;
  if (validatedData.customFields) {
    customFields = new Map(Object.entries(validatedData.customFields));
  }

  const event = await EventModel.create({
    name: validatedData.name,
    description: validatedData.description,
    eventDate: validatedData.eventDate || null,
    place: validatedData.place || null,
    createdBy: new mongoose.Types.ObjectId(data.createdBy),
    customFields: customFields,
    // Add the new eventDates and eventPlaces fields
    eventDates: validatedData.eventDates || {
      dates: [],
      maxDates: 0,
      allowUserAdd: true
    },
    eventPlaces: validatedData.eventPlaces || {
      places: [],
      maxPlaces: 0,
      allowUserAdd: true
    },
    votingCategories: votingCategories
  });

  appAssert(
    event,
    INTERNAL_SERVER_ERROR,
    "Failed to create event"
  );

  return {
    event
  };
};
