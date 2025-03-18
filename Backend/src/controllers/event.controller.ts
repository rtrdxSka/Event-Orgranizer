import { Request, Response } from "express";
import catchErrors from "../utils/catchErrors";
import { createEvent, getEventByUUID } from "../services/event.service";
import appAssert from "../utils/appAssert";
import { BAD_REQUEST, OK } from "../constants/http";


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
  const { event } = await getEventByUUID(eventUUID);

  return res.status(OK).json({event});
});
