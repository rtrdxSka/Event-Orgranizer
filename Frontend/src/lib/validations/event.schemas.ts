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
  maxOptions: z.number().min(0).optional(),
  allowUserAddOptions: z.boolean().default(false),
});

export type RadioField = z.infer<typeof radioFieldSchema>;

// Additional validation for radio fields
export const validateRadioField = (field: RadioField): string | true => {
  if (field.readonly) {
    // For readonly fields, must have a selected option
    if (field.selectedOption === null) {
      return "Read-only radio fields must have a selected option";
    }
  }

  
  
  // Validate that all options have labels
  if (field.options.some(opt => !opt.label.trim())) {
    return "All radio options must have labels";
  }
  
  // Need at least 2 options
  if (field.options.length < 2) {
    return "Radio fields must have at least 2 options";
  }

  const labels = field.options.map(opt => opt.label.toLowerCase());
  if (new Set(labels).size !== labels.length) {
    return "Radio options cannot contain duplicate labels (case-insensitive)";
  }

  if (field.maxOptions && field.maxOptions > 0 && field.allowUserAddOptions) {

    if(field.maxOptions == 1){
    return "Max options cannot be 1 when allowing users to add options. Set max options to 0 for unlimited or a number greater than 1";
  }

  if (field.options.length >= field.maxOptions) {
    return `Current options (${field.options.length}) equals or exceeds max options (${field.maxOptions}). Since users can add options, increase max options to allow room for user additions`;
  }
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
  maxOptions: z.number().min(0).optional(),
  allowUserAddOptions: z.boolean().default(false),
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

  const labels = field.options.map(opt => opt.label.toLowerCase());
  if (new Set(labels).size !== labels.length) {
    return "Checkbox options cannot contain duplicate labels (case-insensitive)";
  }

  if (field.maxOptions && field.maxOptions > 0 && field.allowUserAddOptions) {
  if (field.options.length >= field.maxOptions) {
    return `Current options (${field.options.length}) equals or exceeds max options (${field.maxOptions}). Since users can add options, increase max options to allow room for user additions`;
  }
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

  const lowerCaseValues = nonEmptyValues.map(v => v.toLowerCase());
  if (new Set(lowerCaseValues).size !== lowerCaseValues.length) {
    return "List entries cannot contain duplicates";
  }
  
  if (field.readonly) {

    if(field.allowUserAdd) {
      return "Read-only list fields cannot allow users to add entries";
    }
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
      return "Non-readonly list fields must allow users to add entries"
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
  allowUserAdd: z.boolean().default(true), // Default to allowing users to add dates
  maxVotes: z.number().min(1, "Max votes must be at least 1")
});

export type EventDatesSchema = z.infer<typeof eventDatesSchema>;

export const validateEventDates = (eventDates: EventDatesSchema): string | true => {
  const nonEmptyDates = eventDates.dates.filter(date => date.trim() !== '');
  
  if (nonEmptyDates.length === 0) {
    return "At least one event date must be provided";
  }

  if (eventDates.maxDates > 0 && eventDates.maxVotes > eventDates.maxDates) {
  return `Max votes (${eventDates.maxVotes}) cannot be greater than max dates (${eventDates.maxDates})`;
}
  
  const hasEmptyField = eventDates.dates.some(date => date.trim() === '');
  const hasRoomForMore = eventDates.maxDates === 0 || eventDates.dates.length < eventDates.maxDates;
  
  // Check if users can add dates
  if (!eventDates.allowUserAdd) {
    // If users can't add dates, we must provide an empty field for them
    // if (!hasEmptyField) {
    //   return "Must include an empty date field for user input since users cannot add their own dates";
    // }
  } else {
    // If users can add dates, either need an empty field or room for more
    if (!hasEmptyField && !hasRoomForMore) {
      return "Must either have an empty date field or room for more dates";
    }
  }
  
  // Additional validation for max dates
  if (eventDates.maxDates > 0 && eventDates.dates.length > eventDates.maxDates) {
    return `Number of dates (${eventDates.dates.length}) exceeds maximum allowed (${eventDates.maxDates})`;
  }
  
  return true;
};

export const eventPlaceSchema = z.object({
  places: z.array(z.string()).min(1, "At least one place for the event must be provided").refine(
    places => places.filter(place => place.trim() !== '').length > 0,
    "At least one event place must have a value"
  ),
  maxPlaces: z.number().min(0, "Max dates cannot be negative"),
  allowUserAdd: z.boolean().default(true), // Default to allowing users to add dates
  maxVotes: z.number().min(1, "Max votes must be at least 1")
});

export type EventPlaceSchema = z.infer<typeof eventPlaceSchema>;

export const validateEventPlaces = (eventPlaces: EventPlaceSchema): string | true => {
  const nonEmptyDates = eventPlaces.places.filter(place => place.trim() !== '');
  
  if (nonEmptyDates.length === 0) {
    return "At least one event place must be provided";
  }

  if (eventPlaces.maxPlaces > 0 && eventPlaces.maxVotes > eventPlaces.maxPlaces) {
  return `Max votes (${eventPlaces.maxVotes}) cannot be greater than max places (${eventPlaces.maxPlaces})`;
}
  
  const hasEmptyField = eventPlaces.places.some(place => place.trim() === '');
  const hasRoomForMore = eventPlaces.maxPlaces === 0 || eventPlaces.places.length < eventPlaces.maxPlaces;
  
  // Check if users can add dates
  if (!eventPlaces.allowUserAdd) {
    // If users can't add dates, we must provide an empty field for them
    // if (!hasEmptyField) {
    //   return "Must include an empty date field for user input since users cannot add their own dates";
    // }
  } else {
    // If users can add dates, either need an empty field or room for more
    if (!hasEmptyField && !hasRoomForMore) {
      return "Must either have an empty place field or room for more places";
    }
  }
  
  // Additional validation for max dates
  if (eventPlaces.maxPlaces > 0 && eventPlaces.places.length > eventPlaces.maxPlaces) {
    return `Number of dates (${eventPlaces.places.length}) exceeds maximum allowed (${eventPlaces.maxPlaces})`;
  }
  
  return true;
};

export const validateClosesBy = (closesBy: string | null): string | true => {
  // Now require a closing date to be provided
  if (!closesBy || closesBy.trim() === '') {
    return "Event closing date is required";
  }
  
  // Parse the date and check if it's valid
  const closeDate = new Date(closesBy);
  if (isNaN(closeDate.getTime())) {
    return "Invalid date format";
  }
  
  // Check if it's not a past date
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to beginning of today for fair comparison
  
  if (closeDate < now) {
    return "Closing date cannot be in the past";
  }
  
  return true;
};

// Main event form schema
export const eventFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().min(1, "Event description is required"),
  eventDates: eventDatesSchema,
  place: eventPlaceSchema,
  formFields: z.array(fieldSchema),
  closesBy: z.string().min(1, "Event closing date is required"),
});

export type EventFormSchema = z.infer<typeof eventFormSchema>;

// Add this function to validate field titles are unique across all fields
export const validateUniqueFieldTitles = (formFields: FieldSchema[]): string | true => {
  // Extract all titles and convert to lowercase for case-insensitive comparison
  const fieldTitles = formFields.map(field => field.title.toLowerCase().trim());
  
  // Check if there are duplicates by comparing the length of the array to the size of a Set made from it
  if (new Set(fieldTitles).size !== fieldTitles.length) {
    // Find the duplicate titles
    const duplicates = fieldTitles.filter((title, index) => 
      fieldTitles.indexOf(title) !== index
    );
    
    // Get the first duplicate to mention in the error message
    const firstDuplicate = duplicates[0];
    const originalTitle = formFields.find(f => f.title.toLowerCase().trim() === firstDuplicate)?.title;
    
    return `Duplicate field title found: "${originalTitle}". All field titles must be unique.`;
  }
  
  return true;
};

// Validate the entire form
export const validateForm = (data: EventFormSchema): string | true => {


const closesByValidation = validateClosesBy(data.closesBy);
  if (closesByValidation !== true) {
    return `Closing Date: ${closesByValidation}`;
  }
  // First validate that all field titles are unique
  if (data.formFields.length > 0) {
    const titleValidation = validateUniqueFieldTitles(data.formFields);
    if (titleValidation !== true) {
      return titleValidation;
    }
  }


  // Validate event dates
  const dateValidation = validateEventDates(data.eventDates);
  const placeValidation = validateEventPlaces(data.place);
  
  if (dateValidation !== true) {
    return `Event Dates: ${dateValidation}`;
  }

  if(placeValidation !== true) {
    return `Event Places: ${placeValidation}`;
  }
  
  // Validate each field (existing logic unchanged)
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