import { Router } from "express";
import { closeEventHandler, createEventHandler, finalizeEventHandler, getEventByUUIDHandler, getEventForOwnerHandler, getEventResponsesHandler, getFinalizedEventHandler, getOtherUserResponsesHandler, getUserCreatedEventsHandler, getUserEventResponseHandler, getUserRespondedEventsHandler, removeEventOptionHandler, reopenEventHandler, submitEventResponseHandler } from "../controllers/event.controller";
import authenticate from "../middleware/authenticate";

const eventRoutes = Router();

eventRoutes.post("/create", authenticate, createEventHandler);
eventRoutes.get("/submit/:eventUUID", authenticate, getEventByUUIDHandler);
eventRoutes.post("/response", authenticate, submitEventResponseHandler);
eventRoutes.get("/:eventId/responses", authenticate, getEventResponsesHandler);
eventRoutes.get("/:eventId/response", authenticate, getUserEventResponseHandler);
eventRoutes.get("/:eventId/other-responses", authenticate, getOtherUserResponsesHandler);
eventRoutes.get("/created", authenticate, getUserCreatedEventsHandler);
eventRoutes.get("/responded", authenticate, getUserRespondedEventsHandler);
eventRoutes.get("/:eventId/edit", authenticate, getEventForOwnerHandler);
// Event status management routes
eventRoutes.patch("/:eventId/close", authenticate, closeEventHandler);
eventRoutes.patch("/:eventId/reopen", authenticate, reopenEventHandler);
eventRoutes.post("/:eventId/finalize", authenticate, finalizeEventHandler);
eventRoutes.get("/finalized/:eventUUID", authenticate, getFinalizedEventHandler);
eventRoutes.delete("/:eventId/option", authenticate, removeEventOptionHandler);
export default eventRoutes;