import { NOT_FOUND, CONFLICT, TOO_MANY_REQUESTS, UNAUTHORIZED } from "../constants/http";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import VerificationCodeType from "../constants/verificationCodeTypes";
import appAssert from "../utils/appAssert";
import { sendMail } from "../utils/sendMail";
import { getVerifyEmailTemplate } from "../utils/emailTemplates";
import { APP_ORIGIN } from "../constants/env";
import { fiveMinutesAgo, oneYearFromNow } from "../utils/date";
import { UpdateUserInput } from "../validations/user.schemas";
import EventResponseModel from "../models/eventResponse.model";
import { hashValue } from "../utils/bcrypt";


export const getUserById = async (userId: string) => {
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");
  return user.omitPassword();
};

// Helper function to send verification email
export const sendVerificationEmail = async (userId: string, email: string) => {
  // Check email rate limit - max 1 verification email per 5 minutes
  const fiveMinAgo = fiveMinutesAgo();
  const count = await VerificationCodeModel.countDocuments({
    userId,
    type: VerificationCodeType.EmailVerification,
    createdAt: { $gt: fiveMinAgo }
  });

  appAssert(count <= 1, TOO_MANY_REQUESTS, "Too many verification emails sent, please try again later");

  // Create verification code
  const expiresAt = oneYearFromNow();
  const verificationCode = await VerificationCodeModel.create({
    userId,
    type: VerificationCodeType.EmailVerification,
    expiresAt
  });

  // Send verification email
  const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;
  const { error } = await sendMail({
    to: email,
    ...getVerifyEmailTemplate(url)
  });

  if (error) {
    console.log('Verification email error:', error);
  }

  return {
    url,
    emailSent: !error
  };
};

export const updateUser = async (userId: string, updateData: UpdateUserInput) => {
  // Check if user exists
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");

  let emailChanged = false;
  let passwordChanged = false;
  let internalUpdateData: any = {};
  const oldEmail = user.email;

  // Handle password update
  if (updateData.currentPassword && updateData.newPassword) {
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(updateData.currentPassword);
    appAssert(isCurrentPasswordValid, UNAUTHORIZED, "Current password is incorrect");
    
    // Hash the new password manually (since findByIdAndUpdate bypasses pre-save hooks)
    const hashedPassword = await hashValue(updateData.newPassword, 10);
    internalUpdateData.password = hashedPassword;
    passwordChanged = true;
  }

  // Handle email update
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await UserModel.findOne({ 
      email: updateData.email,
      _id: { $ne: userId } // Exclude current user
    });
    
    appAssert(!existingUser, CONFLICT, "Email is already taken");
    
    // Add email to update data and set verified to false
    internalUpdateData.email = updateData.email;
    internalUpdateData.verified = false;
    emailChanged = true;
  }

  // Ensure we have something to update
  appAssert(
    Object.keys(internalUpdateData).length > 0, 
    NOT_FOUND, 
    "No valid changes provided"
  );

  // Update user
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    internalUpdateData,
    { 
      new: true, // Return updated document
      runValidators: true // Run mongoose validators
    }
  );

  appAssert(updatedUser, NOT_FOUND, "User not found");

  // If email changed, update all associated EventResponse documents
  let eventResponsesUpdated = 0;
  if (emailChanged && updateData.email) {
    try {
      // Update all EventResponse documents with the old email to use the new email
      const updateResult = await EventResponseModel.updateMany(
        { userEmail: oldEmail }, // Find all responses with old email
        { $set: { userEmail: updateData.email } } // Update to new email
      );
      
      eventResponsesUpdated = updateResult.modifiedCount;
      
      if (eventResponsesUpdated > 0) {
        console.log(`Updated email in ${eventResponsesUpdated} event responses from ${oldEmail} to ${updateData.email}`);
      }
    } catch (error) {
      console.error('Error updating event responses email:', error);
      // Don't fail the entire operation, just log the error
    }
  }

  // Send verification email if email was changed (same pattern as registration)
  let verificationResult = null;
  if (emailChanged && updateData.email) {
    verificationResult = await sendVerificationEmail(userId, updateData.email);
  }

  return {
    user: updatedUser.omitPassword(),
    emailChanged,
    passwordChanged,
    verificationResult,
    eventResponsesUpdated
  };
};