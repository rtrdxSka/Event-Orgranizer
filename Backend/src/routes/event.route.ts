import { Router } from "express";
import { createEventHandler, getEventByUUIDHandler, getEventForOwnerHandler, getEventResponsesHandler, getOtherUserResponsesHandler, getUserCreatedEventsHandler, getUserEventResponseHandler, getUserRespondedEventsHandler, submitEventResponseHandler } from "../controllers/event.controller";
import authenticate from "../middleware/authenticate";

const eventRoutes = Router();

eventRoutes.post("/create", createEventHandler);
eventRoutes.get("/submit/:eventUUID", getEventByUUIDHandler);
eventRoutes.post("/response", authenticate, submitEventResponseHandler);
eventRoutes.get("/:eventId/responses", authenticate, getEventResponsesHandler);
eventRoutes.get("/:eventId/response", authenticate, getUserEventResponseHandler);
eventRoutes.get("/:eventId/other-responses", authenticate, getOtherUserResponsesHandler);
eventRoutes.get("/created", authenticate, getUserCreatedEventsHandler);
eventRoutes.get("/responded", authenticate, getUserRespondedEventsHandler);
eventRoutes.get("/:eventId/edit", authenticate, getEventForOwnerHandler);
export default eventRoutes;