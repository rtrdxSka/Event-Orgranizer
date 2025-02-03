import { INTERNAL_SERVER_ERROR, NOT_FOUND, BAD_REQUEST, UNAUTHORIZED } from "../constants/http";
import { createEventSchema, type CreateEventInput } from "../controllers/event.schemas";
import EventModel from "../models/event.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import mongoose from "mongoose";
import { generateEventCode } from "../utils/event";


const generateUniqueEventCode = async (): Promise<string> => {
  let code: string;
  let isUnique = false;
  
  while (!isUnique) {
    code = generateEventCode();
    const existingEvent = await EventModel.findOne({ eventCode: code });
    if (!existingEvent) {
      isUnique = true;
      return code;
    }
  }
  throw new Error("Failed to generate unique event code");
};

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

  const eventCode = await generateUniqueEventCode();
  const validatedData = validationResult.data;

  const event = await EventModel.create({
    name: validatedData.name,
    description: validatedData.description,
    eventCode,
    eventDate: validatedData.eventDate || null,
    place: validatedData.place || null,
    createdBy: new mongoose.Types.ObjectId(data.createdBy),
    customFields: validatedData.customFields || {},
    votingCategories: [
      {
        categoryName: "date",
        options: validatedData.eventDate ? [{ 
          optionName: validatedData.eventDate.toISOString(),
          votes: []
        }] : []
      },
      {
        categoryName: "time",
        options: []
      },
      {
        categoryName: "place",
        options: validatedData.place ? [{ 
          optionName: validatedData.place,
          votes: []
        }] : []
      }
    ]
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