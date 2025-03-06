import { Request, Response } from "express";
import catchErrors from "../utils/catchErrors";
import { createEvent } from "../services/event.service";


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

