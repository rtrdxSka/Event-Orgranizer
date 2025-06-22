import { BAD_REQUEST, NOT_FOUND, OK } from "../constants/http";
import UserModel from "../models/user.model";
import { updateUser } from "../services/user.service";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import { updateUserSchema } from "../validations/user.schemas";


export const  getUserHandler = catchErrors(async (req, res) => {

  const user = await UserModel.findById(req.userId);
  appAssert(user,NOT_FOUND,"User not found");
  return res.status(OK).json(user.omitPassword());

});

export const updateUserHandler = catchErrors(async (req, res) => {
  // Validate request body
  const validationResult = updateUserSchema.safeParse(req.body);
  
  if (!validationResult.success) {
    const errorDetails = validationResult.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join('; ');
    
    appAssert(false, BAD_REQUEST, `Validation failed: ${errorDetails}`);
  }

  const updateData = validationResult.data;
  const result = await updateUser(req.userId.toString(), updateData);

  // Build success message based on what was updated
  let messageParts = [];
  
  if (result.emailChanged && result.passwordChanged) {
    messageParts.push("Email and password updated successfully");
    if (result.verificationResult?.emailSent) {
      messageParts.push("Please check your new email for verification");
    } else {
      messageParts.push("Verification email could not be sent, please try again later");
    }
  } else if (result.emailChanged) {
    messageParts.push("Email updated successfully");
    if (result.verificationResult?.emailSent) {
      messageParts.push("Please check your new email for verification");
    } else {
      messageParts.push("Verification email could not be sent, please try again later");
    }
  } else if (result.passwordChanged) {
    messageParts.push("Password updated successfully");
  }
  
  // Add event responses update info if applicable
  if (result.eventResponsesUpdated > 0) {
    messageParts.push(`Updated ${result.eventResponsesUpdated} event response(s) with your new email`);
  }

  const message = messageParts.join(". ") + ".";

  return res.status(OK).json({
    status: "success",
    message,
    data: {
      user: result.user,
      ...(result.emailChanged && { 
        eventResponsesUpdated: result.eventResponsesUpdated 
      })
    }
  });
});