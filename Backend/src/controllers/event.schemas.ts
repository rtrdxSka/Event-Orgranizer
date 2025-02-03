import { z } from "zod";

export const nameSchema = z.string().min(1).max(100);
export const descriptionSchema = z.string().min(1).max(1000);

const customFieldValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.any()),
  z.record(z.any())
]);

export const createEventSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  createdBy: z.string().min(1),
  eventDate: z.string().datetime().transform((str) => new Date(str)).optional(),
  place: z.string().min(1).max(255).optional(),
  customFields: z.record(customFieldValue).optional()
});

export type CreateEventInput = z.infer<typeof createEventSchema>;