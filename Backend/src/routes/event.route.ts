import { Router } from "express";
import { createEventHandler, getEventByUUIDHandler } from "../controllers/event.controller";

const eventRoutes = Router();

eventRoutes.post("/create", createEventHandler);
eventRoutes.get("/submit/:eventUUID", getEventByUUIDHandler)

export default eventRoutes;