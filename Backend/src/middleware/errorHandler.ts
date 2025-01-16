import { ErrorRequestHandler } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import {z} from "zod";
import { Response } from "express";
import AppError from "../utils/AppError";


const handleZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map((err) => ({
    path: err.path.join("."),
    message: err.message
  }))

  res.status(BAD_REQUEST).json({
    message:error.message,
    errors
  })
}

const handleAppError = (res: Response, error: AppError) => {
    res.status(error.statusCode).json({
    message: error.message,
    errorCode: error.errorCode
  });
}

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH: ${req.path}`, error);

  if(error instanceof z.ZodError) {
   handleZodError(res, error);
   return;
  }

  if (error instanceof AppError) {
     handleAppError(res, error);
     return;
  }

 res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error");
};

export default errorHandler;