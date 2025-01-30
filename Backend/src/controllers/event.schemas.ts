import { z } from "zod";

// Basic field schemas
export const nameSchema = z.string().min(1).max(100);
export const descriptionSchema = z.string().min(1).max(1000);

// Schema for custom fields - allowing any valid JSON value
const customFieldValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.any()),
  z.record(z.any())
]);

// Main create event schema
export const createEventSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  createdBy: z.string().min(1), // MongoDB ObjectId as string
  customFields: z.record(customFieldValue).optional()
});

// Type inference from schema
export type CreateEventInput = z.infer<typeof createEventSchema>;