import {z} from "zod";

export const emailSchema = z.string().email().min(1).max(255);
const passwordSchema = z.string().min(6).max(255);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
})

export const registerSchema = loginSchema.extend({
  confirmPassword: z.string().min(6).max(255),
}).refine(
  (data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);
