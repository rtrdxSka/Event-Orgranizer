// eventValidation.ts
import { z } from "zod";

const customFieldValueSchema = z.union([
  z.string(),
  z.array(z.string())
]);

export const createEventValidationSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100, "Event name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters"),
  eventDate: z.string().optional(),  // Changed this to accept string and handle transformation in the API call
  place: z.string().min(1).max(255).optional(),
  customFields: z.record(customFieldValueSchema).optional()
});

export type CreateEventInput = z.infer<typeof createEventValidationSchema>;