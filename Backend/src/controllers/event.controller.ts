import { Request, Response } from "express";
import catchErrors from "../utils/catchErrors";
import { createEvent } from "../services/event.service";
import { createEventSchema } from "./event.schemas";

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

// Example of how this would be called:
/*
POST /api/events
{
  "name": "Board Game Night",
  "description": "Monthly gaming session",
  "customFields": {
    "boardGame": "Catan",
    "playerLimit": 6,
    "location": "John's house"
  }
}
*/