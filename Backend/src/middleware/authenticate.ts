import { RequestHandler } from "express";
import appAssert from "../utils/appAssert";
import AppErrorCode from "../constants/appErrorCode";
import { AccessTokenPayload, verifyToken } from "../utils/jwt";
import { UNAUTHORIZED } from "../constants/http";
import mongoose from "mongoose";
import UserModel from "../models/user.model";

const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken as string | undefined;
    appAssert(accessToken, 401, "Unauthorized", AppErrorCode.InvalidAccessToken);

    const { error, payload } = verifyToken<AccessTokenPayload>(accessToken);
    appAssert(payload, UNAUTHORIZED, error === "jwt expired" ? "Token expired" : "Invalid Token", AppErrorCode.InvalidAccessToken);

    req.userId = payload.userId as mongoose.Types.ObjectId;
    req.sessionId = payload.sessionId as mongoose.Types.ObjectId;
    
    // Fetch user to get email
    const user = await UserModel.findById(payload.userId);
    if (user) {
      req.userEmail = user.email;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;