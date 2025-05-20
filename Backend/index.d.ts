import mongoose from "mongoose";
import 'express';
declare global {
  namespace Express {
    interface Request {
      userId: mongoose.Types.ObjectId;
      sessionId: mongoose.Types.ObjectId;
    }
  }
}
declare global {
  namespace Express {
    interface Request {
      userId: mongoose.Types.ObjectId;
      sessionId: mongoose.Types.ObjectId;
      userEmail?: string;
      userName?: string;
    }
  }
}
export {};