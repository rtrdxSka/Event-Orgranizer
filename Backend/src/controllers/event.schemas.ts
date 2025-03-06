import { z } from "zod";

// Basic field schemas
export const nameSchema = z.string().min(1, "Event name is required").max(100);
export const descriptionSchema = z.string().min(1, "Event description is required").max(1000);

// Event dates schema
export const eventDatesSchema = z.object({
  dates: z.array(z.string().datetime()),
  maxDates: z.number().min(0, "Max dates cannot be negative"),
  allowUserAdd: z.boolean().default(true)
});

// Event places schema
export const eventPlacesSchema = z.object({
  places: z.array(z.string().min(1)),
  maxPlaces: z.number().min(0, "Max places cannot be negative"),
  allowUserAdd: z.boolean().default(true)
});

// Voting option schemas
export const votingOptionSchema = z.object({
  optionName: z.string().min(1),
  votes: z.array(z.string()).default([])
});

// Voting category schema
export const votingCategorySchema = z.object({
  categoryName: z.string().min(1),
  options: z.array(votingOptionSchema)
});

// Custom field schemas
// We're defining the shape each field type would have in the customFields object
const textFieldSchema = z.object({
  id: z.number().optional(),
  type: z.literal("text"),
  title: z.string().min(1),
  placeholder: z.string().optional(),
  value: z.string().optional(),
  required: z.boolean().optional().default(false),
  readonly: z.boolean().optional().default(false),
  optional: z.boolean().optional().default(true)
});

const listFieldSchema = z.object({
  id: z.number().optional(),
  type: z.literal("list"),
  title: z.string().min(1),
  placeholder: z.string().optional(),
  values: z.array(z.string()),
  maxEntries: z.number().min(0).optional(),
  allowUserAdd: z.boolean().optional().default(true),
  required: z.boolean().optional().default(false),
  readonly: z.boolean().optional().default(false),
  optional: z.boolean().optional().default(true)
});

const radioOptionSchema = z.object({
  id: z.number().optional(),
  label: z.string().min(1)
});

const radioFieldSchema = z.object({
  id: z.number().optional(),
  type: z.literal("radio"),
  title: z.string().min(1),
  placeholder: z.string().optional(),
  options: z.array(radioOptionSchema),
  maxOptions: z.number().min(0).optional(),
  allowUserAddOptions: z.boolean().optional().default(false),
  required: z.boolean().optional().default(false),
  optional: z.boolean().optional().default(true)
});

const checkboxOptionSchema = z.object({
  id: z.number().optional(),
  label: z.string().min(1)
});

const checkboxFieldSchema = z.object({
  id: z.number().optional(),
  type: z.literal("checkbox"),
  title: z.string().min(1),
  placeholder: z.string().optional(),
  options: z.array(checkboxOptionSchema),
  maxOptions: z.number().min(0).optional(),
  allowUserAddOptions: z.boolean().optional().default(false),
  required: z.boolean().optional().default(false),
  optional: z.boolean().optional().default(true)
});

// Combined custom field schema as a discriminated union
const customFieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  listFieldSchema,
  radioFieldSchema,
  checkboxFieldSchema
]);

// Main event creation schema
export const createEventSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  createdBy: z.string().min(1),
  eventDate: z.string().datetime().transform((str) => new Date(str)).optional(),
  place: z.string().min(1).max(255).optional(),
  eventDates: eventDatesSchema.optional(),
  eventPlaces: eventPlacesSchema.optional(),
  customFields: z.record(customFieldSchema).optional(),
  votingCategories: z.array(votingCategorySchema).optional()
});

export type CreateEventInput = z.infer<typeof createEventSchema>;