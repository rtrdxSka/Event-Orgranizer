import { INTERNAL_SERVER_ERROR, NOT_FOUND, BAD_REQUEST, UNAUTHORIZED } from "../constants/http";
import { createEventSchema, type CreateEventInput } from "../controllers/event.schemas";
import EventModel from "../models/event.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import mongoose from "mongoose";


export const createEvent = async (data: CreateEventInput) => {
  // Validate input data
  const validationResult = createEventSchema.safeParse(data);
  appAssert(
    validationResult.success,
    BAD_REQUEST,
    validationResult.success ? "" : validationResult.error.message
  );

  // Verify user exists
  const userExists = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(data.createdBy)
  });
  
  appAssert(
    userExists,
    UNAUTHORIZED,
    "UNAUTHORIZED REQUEST"
  );
    // Create the event
    const event = await EventModel.create({
      name: data.name,
      description: data.description,
      createdBy: new mongoose.Types.ObjectId(data.createdBy),
      customFields: data.customFields || {},
      votingCategories: [] // Default empty array for now
    });

    appAssert(
      event,
      INTERNAL_SERVER_ERROR,
      "Failed to create event"
    );

    // Return the created event
    return {
      event
    };

};

// Example usage:
/*
await createEvent({
  name: "Board Game Night",
  description: "Monthly gaming session",
  createdBy: "507f1f77bcf86cd799439011",
  customFields: {
    boardGame: "Catan",
    playerLimit: 6,
    location: "John's house"
  }
});
*/