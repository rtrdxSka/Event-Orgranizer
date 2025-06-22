// lib/validations/user.schemas.ts
import { z } from "zod";

export const emailSchema = z.string().email().min(1).max(255);
const passwordSchema = z.string().min(6).max(255);

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  currentPassword: passwordSchema.optional(),
  newPassword: passwordSchema.optional(),
  confirmPassword: passwordSchema.optional(),
}).refine(
  (data) => {
    // At least one field must be provided for update
    return Object.keys(data).length > 0 && (data.email || data.newPassword);
  },
  {
    message: "At least email or password must be provided for update",
  }
).refine(
  (data) => {
    // If any password field is provided, all password fields must be provided
    const passwordFields = [data.currentPassword, data.newPassword, data.confirmPassword];
    const providedPasswordFields = passwordFields.filter(field => field !== undefined && field !== "");
    
    if (providedPasswordFields.length > 0) {
      return providedPasswordFields.length === 3;
    }
    return true;
  },
  {
    message: "If updating password, current password, new password, and confirm password are all required",
    path: ["currentPassword"],
  }
).refine(
  (data) => {
    // New password and confirm password must match
    if (data.newPassword && data.confirmPassword) {
      return data.newPassword === data.confirmPassword;
    }
    return true;
  },
  {
    message: "New password and confirm password do not match",
    path: ["confirmPassword"],
  }
).refine(
  (data) => {
    // Current password and new password must be different
    if (data.currentPassword && data.newPassword) {
      return data.currentPassword !== data.newPassword;
    }
    return true;
  },
  {
    message: "New password must be different from current password",
    path: ["newPassword"],
  }
);

export type UpdateUserInput = z.infer<typeof updateUserSchema>;