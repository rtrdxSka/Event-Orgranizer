import { z } from "zod";

// Define the field types enum
export const fieldTypeEnum = z.enum(["text", "list", "radio", "checkbox"]);
export type FieldType = z.infer<typeof fieldTypeEnum>;

// Base schema for all field types with common properties
const baseFieldSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "All fields must have a title"),
  placeholder: z.string(),
  value: z.string(),
  required: z.boolean(),
  readonly: z.boolean(),
});

// ===== TEXT FIELD =====
export const textFieldSchema = z.object({
  ...baseFieldSchema.shape,
  type: z.literal("text"),
});

export type TextField = z.infer<typeof textFieldSchema>;

// Additional validation for text fields
export const validateTextField = (field: TextField): string | true => {
  if (field.readonly) {
    // For readonly text fields: must have a value
    if (field.value.trim() === "") {
      return "Read-only text fields must have a value";
    }
  } else if ((field.required || (!field.required && !field.readonly)) && field.value.trim() !== "") {
    // For required/optional text fields: must be empty for form creation
    return `${field.required ? 'Required' : 'Optional'} text fields must be empty for form creation`;
  }
  return true;
};

// ===== RADIO FIELD =====
const radioOptionSchema = z.object({
  id: z.number(),
  label: z.string().min(1, "All radio options must have labels"),
});

export const radioFieldSchema = z.object({
  ...baseFieldSchema.shape,
  type: z.literal("radio"),
  options: z.array(radioOptionSchema).min(2, "Radio fields must have at least 2 options"),
  selectedOption: z.number().nullable(),
});

export type RadioField = z.infer<typeof radioFieldSchema>;

// Additional validation for radio fields
export const validateRadioField = (field: RadioField): string | true => {
  if (field.readonly) {
    // For readonly fields, must have a selected option
    if (field.selectedOption === null) {
      return "Read-only radio fields must have a selected option";
    }
  } else if (field.selectedOption !== null) {
    // For required/optional fields, should not have a selection during creation
    return `${field.required ? 'Required' : 'Optional'} radio fields should not have a selection during creation`;
  }
  
  // Validate that all options have labels
  if (field.options.some(opt => !opt.label.trim())) {
    return "All radio options must have labels";
  }
  
  // Need at least 2 options
  if (field.options.length < 2) {
    return "Radio fields must have at least 2 options";
  }
  
  return true;
};

// ===== CHECKBOX FIELD =====
const checkboxOptionSchema = z.object({
  id: z.number(),
  label: z.string().min(1, "All checkbox options must have labels"),
  checked: z.boolean(),
});

export const checkboxFieldSchema = z.object({
  ...baseFieldSchema.shape,
  type: z.literal("checkbox"),
  options: z.array(checkboxOptionSchema).min(1, "Checkbox fields must have at least 1 option"),
});

export type CheckboxField = z.infer<typeof checkboxFieldSchema>;

// Additional validation for checkbox fields
export const validateCheckboxField = (field: CheckboxField): string | true => {
  if (field.readonly) {
    // For readonly fields, at least one option should be checked
    if (!field.options.some(opt => opt.checked)) {
      return "Read-only checkbox fields must have at least one checked option";
    }
  }
  
  // Validate that all options have labels
  if (field.options.some(opt => !opt.label.trim())) {
    return "All checkbox options must have labels";
  }
  
  // Need at least 1 option
  if (field.options.length < 1) {
    return "Checkbox fields must have at least 1 option";
  }
  
  return true;
};

// ===== LIST FIELD =====
export const listFieldSchema = z.object({
  ...baseFieldSchema.shape,
  type: z.literal("list"),
  values: z.array(z.string()),
  maxEntries: z.number().min(0),
  allowUserAdd: z.boolean(),
});

export type ListField = z.infer<typeof listFieldSchema>;

// Additional validation for list fields
export const validateListField = (field: ListField): string | true => {
  const nonEmptyValues = field.values.filter(v => v.trim() !== '');
  
  if (field.readonly) {
    // For readonly list fields: all entries must have values
    if (field.maxEntries > 0) {
      // If max entries is set
      if (field.values.length < field.maxEntries) {
        return `Read-only list must have exactly ${field.maxEntries} entries. Currently has ${field.values.length}`;
      }
      if (nonEmptyValues.length !== field.maxEntries) {
        return `All ${field.maxEntries} entries in read-only list must have values`;
      }
    } else {
      // If unlimited entries
      if (field.values.some(v => !v.trim())) {
        return "All entries in read-only list must have values";
      }
    }
  } else {
    // For editable fields (required or optional)
    const hasEmptyField = field.values.some(v => v.trim() === '');
    const hasRoomForMore = field.maxEntries === 0 || field.values.length < field.maxEntries;
    
    // Check if users can add entries
    if (!field.allowUserAdd) {
      // If users can't add entries, we must provide an empty field
      if (!hasEmptyField) {
        return "Must include an empty field for user input since users cannot add their own entries";
      }
    } else {
      // If users can add entries, either need an empty field or room for more
      if (!hasEmptyField && !hasRoomForMore) {
        return "Must either have an empty field or room for more entries";
      }
    }

    // Additional validation for max entries
    if (field.maxEntries > 0 && field.values.length > field.maxEntries) {
      return `Number of fields (${field.values.length}) exceeds maximum allowed (${field.maxEntries})`;
    }
  }
  
  return true;
};

// Combine all field types into a discriminated union using the 'type' property
export const fieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  radioFieldSchema,
  checkboxFieldSchema,
  listFieldSchema,
]);

export type FieldSchema = z.infer<typeof fieldSchema>;

// Create the schema for event dates
export const eventDatesSchema = z.object({
  dates: z.array(z.string()).min(1, "At least one event date must be provided").refine(
    dates => dates.filter(date => date.trim() !== '').length > 0,
    "At least one event date must have a value"
  ),
  maxDates: z.number().min(0, "Max dates cannot be negative"),
});

export type EventDatesSchema = z.infer<typeof eventDatesSchema>;

// Main event form schema
export const eventFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().min(1, "Event description is required"),
  eventDates: eventDatesSchema,
  place: z.string().optional(),
  formFields: z.array(fieldSchema),
});

export type EventFormSchema = z.infer<typeof eventFormSchema>;

// Validate the entire form
export const validateForm = (data: EventFormSchema): string | true => {
  // First validate event dates
  const validDates = data.eventDates.dates.filter(date => date.trim() !== '');
  if (validDates.length === 0) {
    return "At least one event date must be provided";
  }
  
  // Validate each field
  for (const field of data.formFields) {
    if (field.type === "text") {
      const result = validateTextField(field);
      if (result !== true) return `${field.title}: ${result}`;
    } 
    else if (field.type === "radio") {
      const result = validateRadioField(field);
      if (result !== true) return `${field.title}: ${result}`;
    }
    else if (field.type === "checkbox") {
      const result = validateCheckboxField(field);
      if (result !== true) return `${field.title}: ${result}`;
    }
    else if (field.type === "list") {
      const result = validateListField(field);
      if (result !== true) return `${field.title}: ${result}`;
    }
  }
  
  return true;
};