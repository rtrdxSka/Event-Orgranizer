import { Router } from "express";
import { getUserHandler, updateUserHandler } from "../controllers/user.controller";
import authenticate from "../middleware/authenticate";


const userRoutes = Router();

//prefix: /user

userRoutes.get("/", getUserHandler);
userRoutes.put("/", authenticate, updateUserHandler);

export default userRoutes; 