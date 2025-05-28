import { Request, Response } from "express";
import catchErrors from "../utils/catchErrors";
import { closeEvent, createEvent, createOrUpdateEventResponse, finalizeEvent, getEventByUUID, getEventForOwner, getEventResponses, getFinalizedEventData, getOtherUserResponses, getUserCreatedEvents, getUserEventResponse, getUserRespondedEvents, removeEventOption, reopenEvent, updateEventResponseWithNotifications, verifyEventAcceptsResponses } from "../services/event.service";
import appAssert from "../utils/appAssert";
import { BAD_REQUEST, CREATED, FORBIDDEN, OK } from "../constants/http";
import { createEventResponseSchema } from "../validations/eventResponse.schemas";
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
  
  // Add query parameters for pagination and limits
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
  const page = Math.max(parseInt(req.query.page as string) || 0, 0);
  const maxSuggestionsPerField = Math.min(parseInt(req.query.maxSuggestions as string) || 50, 200);
  
  const data = await getOtherUserResponses(eventId, userId, {
    limit,
    page, 
    maxSuggestionsPerField
  });

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

//event status controller

export const closeEventHandler = catchErrors(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.userId.toString();
  
  const event = await closeEvent(eventId, userId);
  
  return res.status(OK).json({
    status: "success",
    message: "Event closed successfully",
    data: {
      event: {
        _id: event._id,
        name: event.name,
        status: event.status
      }
    }
  });
});

// Reopen an event
export const reopenEventHandler = catchErrors(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.userId.toString();
  
  const event = await reopenEvent(eventId, userId);
  
  return res.status(OK).json({
    status: "success",
    message: "Event reopened successfully",
    data: {
      event: {
        _id: event._id,
        name: event.name,
        status: event.status
      }
    }
  });
});

// Finalize an event
export const finalizeEventHandler = catchErrors(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const userId = req.userId.toString();
  
  // Validate the request body
  appAssert(eventId, BAD_REQUEST, "Event ID is required");
  
  const { date, place, customFields } = req.body;
  
  // Call the service function
  const result = await finalizeEvent(eventId, userId, {
    date,
    place,
    customFields
  });
  
  return res.status(OK).json({
    status: "success",
    message: "Event finalized successfully",
    data: {
      event: result.event
    }
  });
});

export const getFinalizedEventHandler = catchErrors(async (req: Request, res: Response) => {
  const { eventUUID } = req.params;
  
  // Make sure UUID exists
  appAssert(eventUUID, BAD_REQUEST, "Event UUID is required");
  
  // Get the finalized event data from the service
  const data = await getFinalizedEventData(eventUUID);

  return res.status(OK).json({
    status: "success",
    data
  });
})

export const removeEventOptionHandler = catchErrors(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const userId = req.userId.toString();
  const { categoryName, optionName, fieldId } = req.body;
  
  // Validate input
  appAssert(categoryName, BAD_REQUEST, "Category name is required");
  appAssert(optionName, BAD_REQUEST, "Option name is required");
  // fieldId is optional since date/place categories don't have fieldIds
  
  // Call the service function
  const result = await removeEventOption(eventId, userId, categoryName, optionName, fieldId);
  
  return res.status(OK).json({
    status: "success",
    message: "Option removed successfully",
    data: result
  });
});


