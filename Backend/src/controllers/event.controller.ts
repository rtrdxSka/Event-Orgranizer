import { Request, Response } from "express";
import catchErrors from "../utils/catchErrors";
import { createEvent, createOrUpdateEventResponse, getEventByUUID, getEventForOwner, getEventResponses, getOtherUserResponses, getUserCreatedEvents, getUserEventResponse, getUserRespondedEvents, updateEventResponseWithNotifications, verifyEventAcceptsResponses } from "../services/event.service";
import appAssert from "../utils/appAssert";
import { BAD_REQUEST, CREATED, FORBIDDEN, OK } from "../constants/http";
import { createEventResponseSchema } from "./eventResponse.schemas";
import { Document } from "mongoose";
import { EventDocument } from "../models/event.model";


export const createEventHandler = catchErrors(async (req: Request, res: Response) => {
  // The user ID will come from the authenticated session
  const userId = req.userId;
  
  const eventData = {
    ...req.body,
    createdBy: userId
  };

  // Service will handle validation and creation
  const { event } = await createEvent(eventData);

  return res.status(201).json({
    status: "success",
    data: {
      event
    }
  });
});


export const getEventByUUIDHandler = catchErrors(async (req, res) => {
  const { eventUUID } = req.params;
  
  // Make sure UUID exists
  appAssert(eventUUID, BAD_REQUEST, "Event UUID is required");
  
  // Get the event from the service
  const event = await getEventByUUID(eventUUID);

  return res.status(OK).json(event);
});

//event Response controller

export const submitEventResponseHandler = catchErrors(async (req: Request, res: Response) => {
  // Get user ID from the authenticated session
  const userId = req.userId;
  
  // Validate request data
  const validatedData = createEventResponseSchema.parse(req.body);
  // Get user email and name from the authenticated user object

await verifyEventAcceptsResponses(validatedData.eventId);

  const userEmail = req.userEmail;
  appAssert(userEmail, 400, "User email is required");

    await updateEventResponseWithNotifications(
    userId.toString(),
    userEmail,
    validatedData
  );
  
  // Create or update event response
  const { response, event } = await createOrUpdateEventResponse(
    userId.toString(),
    userEmail,
    validatedData
  );

  return res.status(CREATED).json({
    status: "success",
    data: {
      response,
      votingCategories: event.votingCategories
    }
  });
});

export const getEventResponsesHandler = catchErrors(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  
  const { event, responses } = await getEventResponses(eventId);

  return res.status(OK).json({
    status: "success",
    data: {
      event: {
        _id: event._id,
        name: event.name,
        description: event.description,
        votingCategories: event.votingCategories
      },
      responses
    }
  });
});

export const getUserEventResponseHandler = catchErrors(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const userId = req.userId.toString();
  
  const response = await getUserEventResponse(eventId, userId);

  return res.status(OK).json({
    status: "success",
    data: response
  });
});

export const getOtherUserResponsesHandler = catchErrors(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const userId = req.userId.toString();
  
  const data = await getOtherUserResponses(eventId, userId);

  return res.status(OK).json({
    status: "success",
    data
  });
});

export const getUserCreatedEventsHandler = catchErrors(async (req: Request, res: Response) => {
  const userId = req.userId.toString();
  
  // Call the service function
  const events = await getUserCreatedEvents(userId);

  return res.status(OK).json({
    status: "success",
    data: events
  });
});

export const getUserRespondedEventsHandler = catchErrors(async (req: Request, res: Response) => {
  const userId = req.userId.toString();
  
  // Call the service function
  const events = await getUserRespondedEvents(userId);

  return res.status(OK).json({
    status: "success",
    data: events
  });
});


export const getEventForOwnerHandler = catchErrors(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const userId = req.userId.toString();
  
  const data = await getEventForOwner(eventId, userId);
  
  return res.status(OK).json({
    status: "success",
    data
  });
});

