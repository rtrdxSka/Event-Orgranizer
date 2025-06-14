import { z } from "zod";

// Define schemas for voting structure
const votingOptionSchema = z.object({
  optionName: z.string(),
  votes: z.array(z.any()).default([])
});

const votingCategorySchema = z.object({
  categoryName: z.string(),
  options: z.array(votingOptionSchema)
});

// Schema for event dates
const eventDatesSchema = z.object({
  dates: z.array(z.string()),
  maxDates: z.number().min(0),
  allowUserAdd: z.boolean(),
  maxVotes: z.number().min(1)
});

// Schema for event places
const eventPlacesSchema = z.object({
  places: z.array(z.string()),
  maxPlaces: z.number().min(0).optional(),
  allowUserAdd: z.boolean(),
  maxVotes: z.number().min(1)
});

// Schema for base field properties in customFields
const baseCustomFieldSchema = z.object({
  id: z.number(),
  type: z.enum(["text", "list", "radio", "checkbox"]),
  title: z.string().min(1, "Field title is required"),
  placeholder: z.string(),
  required: z.boolean(),
  optional: z.boolean().optional(),
  readonly: z.boolean().optional(),
  value: z.string().optional(),
});

// Text field schema
const textFieldSchema = baseCustomFieldSchema.extend({
  type: z.literal("text"),
});

// Radio field schema
const radioFieldSchema = baseCustomFieldSchema.extend({
  type: z.literal("radio"),
  options: z.array(z.object({
    id: z.number(),
    label: z.string()
  })),
  maxOptions: z.number(),
  allowUserAddOptions: z.boolean(),
  selectedOption: z.number().nullable().optional(),
});

// Checkbox field schema
const checkboxFieldSchema = baseCustomFieldSchema.extend({
  type: z.literal("checkbox"),
  options: z.array(z.object({
    id: z.number(),
    label: z.string(),
    checked: z.boolean().optional()
  })),
  maxOptions: z.number(),
  allowUserAddOptions: z.boolean(),
});

// List field schema
const listFieldSchema = baseCustomFieldSchema.extend({
  type: z.literal("list"),
  values: z.array(z.string()),
  maxEntries: z.number(),
  allowUserAdd: z.boolean(),
});

// Union of all field types
const customFieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  radioFieldSchema,
  checkboxFieldSchema,
  listFieldSchema
]);

// Schema for creating an event
export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().min(1, "Event description is required"),
  createdBy: z.string(),
  customFields: z.record(customFieldSchema).optional(),
  eventDates: eventDatesSchema,
  eventPlaces: eventPlacesSchema,
  votingCategories: z.array(votingCategorySchema).optional(),
  closesBy: z.string().nullable().optional()
    .refine(val => {
      // If not provided or null, it's valid
      if (!val) return true;
      
      // Check if it's a valid date and not in the past
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      
      const now = new Date();
      return date > now;
    }, {
      message: "Closing date must be a valid future date"
    })
});

export type CreateEventInput = z.infer<typeof createEventSchema>;