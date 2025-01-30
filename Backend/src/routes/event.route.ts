import { Router } from "express";
import { createEventHandler } from "../controllers/event.controller";

const eventRoutes = Router();

eventRoutes.post("/create", createEventHandler);

export default eventRoutes;