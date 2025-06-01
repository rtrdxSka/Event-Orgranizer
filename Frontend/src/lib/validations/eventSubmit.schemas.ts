import { z } from 'zod';

// Helper types to match the structure from the backend
export type VotingOption = {
  optionName: string;
  votes: string[]; // IDs of users who voted
};

export type VotingCategory = {
  categoryName: string;
  options: VotingOption[];
};

export type EventDates = {
  allowUserAdd: boolean;
  dates: string[];
  maxDates: number;
  maxVotes?: number;
};

export type EventPlaces = {
  allowUserAdd: boolean;
  places: string[];
  maxPlaces: number;
  maxVotes?: number;
};

export type CustomField = {
  id: string | number;
  type: 'text' | 'radio' | 'checkbox' | 'list';
  title: string;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  value?: string;
  options?: Array<{
    id: number;
    label: string;
    checked?: boolean;
  }>;
  values?: string[];
  maxEntries?: number;
  allowUserAdd?: boolean;
  maxOptions?: number;
  allowUserAddOptions?: boolean;
  selectedOption?: number | null;
};

// Types for the event data coming from the backend
export type EventData = {
  _id: string;
  name: string;
  description: string;
  eventUUID: string;
  eventDate: string | null;
  place: string | null;
  createdBy: string;
  createdAt: string;
  eventDates: EventDates;
  eventPlaces: EventPlaces;
  customFields: Record<string, CustomField>;
  votingCategories: VotingCategory[];
};

// Define schema for the form submission data
export const eventSubmitSchema = z.object({
  // Original event data for validation comparison
  originalEvent: z.object({
    name: z.string(),
    description: z.string(),
    eventDates: z.object({
      allowUserAdd: z.boolean(),
      dates: z.array(z.string()),
      maxDates: z.number(),
      maxVotes: z.number().optional(),
    }),
    eventPlaces: z.object({
      allowUserAdd: z.boolean(),
      places: z.array(z.string()),
      maxPlaces: z.number(),
      maxVotes: z.number().optional(),
    }),
    customFields: z.record(z.any()),
  }),

  // User selections
  selectedDates: z.array(z.string()),
  suggestedDates: z.array(z.string()),
  selectedPlaces: z.array(z.string()),
  suggestedPlaces: z.array(z.string()),
  
  // Custom fields responses
  customFields: z.record(z.any()),
});

// Type for our form data
export type EventSubmitFormData = z.infer<typeof eventSubmitSchema>;

// Function to validate the form data with business logic
export const validateEventSubmit = (data: EventSubmitFormData): true | string => {
  const { originalEvent, selectedDates, suggestedDates, selectedPlaces, suggestedPlaces, customFields } = data;
  
  // New validation: Ensure at least one date is voted for
  if (selectedDates.length === 0) {
    return "You must vote for at least one date";
  }

  if (selectedPlaces.length === 0) {
    return "You must vote for at least one place";
  }

  // Validate dates
  if (suggestedDates.length > 0 && !originalEvent.eventDates.allowUserAdd) {
    return "New dates cannot be added for this event";
  }
  
  const totalDates = [...originalEvent.eventDates.dates, ...suggestedDates];
  if (originalEvent.eventDates.maxDates > 0 && totalDates.length > originalEvent.eventDates.maxDates) {
    return `Too many dates. Maximum allowed is ${originalEvent.eventDates.maxDates}`;
  }
  
  // Validate date votes
  if (originalEvent.eventDates.maxVotes && selectedDates.length > originalEvent.eventDates.maxVotes) {
    return `You can only vote for ${originalEvent.eventDates.maxVotes} dates`;
  }

  // Check if user selected a date that's not in the original or suggested dates
  for (const date of selectedDates) {
    if (!totalDates.includes(date)) {
      return "Selected a date that doesn't exist in options";
    }
  }
  
  // Validate places
  if (suggestedPlaces.length > 0 && !originalEvent.eventPlaces.allowUserAdd) {
    return "New places cannot be added for this event";
  }
  
  const totalPlaces = [...originalEvent.eventPlaces.places, ...suggestedPlaces];
  if (originalEvent.eventPlaces.maxPlaces > 0 && totalPlaces.length > originalEvent.eventPlaces.maxPlaces) {
    return `Too many places. Maximum allowed is ${originalEvent.eventPlaces.maxPlaces}`;
  }
  
  // Validate place votes
  if (originalEvent.eventPlaces.maxVotes && selectedPlaces.length > originalEvent.eventPlaces.maxVotes) {
    return `You can only vote for ${originalEvent.eventPlaces.maxVotes} places`;
  }

  // Check if user selected a place that's not in the original or suggested places
  for (const place of selectedPlaces) {
    if (!totalPlaces.includes(place)) {
      return "Selected a place that doesn't exist in options";
    }
  }
  
  // Validate custom fields
  for (const [fieldId, fieldValue] of Object.entries(customFields)) {
    const fieldDefinition = originalEvent.customFields[fieldId];
    
    if (!fieldDefinition) {
      return `Unknown custom field: ${fieldId}`;
    }
    
    // Text field validation
    if (fieldDefinition.type === 'text') {
      // If readonly, ensure value hasn't changed
      if (fieldDefinition.readonly && fieldValue !== fieldDefinition.value) {
        return `Field "${fieldDefinition.title}" is read-only and cannot be modified`;
      }
      
      // If required, ensure there is a value
      if (fieldDefinition.required && (!fieldValue || fieldValue === '')) {
        return `Field "${fieldDefinition.title}" is required`;
      }
    }
    
    // Radio field validation
else if (fieldDefinition.type === 'radio') {
      // Check if field is required
      if (fieldDefinition.required) {
        // Handle both object format {value: "", userAddedOptions: []} and simple string format
        let selectedValue;
        
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          selectedValue = fieldValue.value;
        } else {
          selectedValue = fieldValue;
        }
        
        // Check if no value is selected
        if (!selectedValue || selectedValue === '' || selectedValue === null || selectedValue === undefined) {
          return `Field "${fieldDefinition.title}" is required`;
        }
      }
    }
    
    // Checkbox field validation
    else if (fieldDefinition.type === 'checkbox') {
      if (fieldDefinition.required) {
        // For checkboxes, the value is an object with option IDs as keys
        const hasChecked = Object.values(fieldValue || {}).some(v => v === true);
        if (!hasChecked) {
          return `Field "${fieldDefinition.title}" requires at least one selection`;
        }
      }
      
      // Validate all selected options exist in original options
      for (const [optionId, isChecked] of Object.entries(fieldValue || {})) {
        if (optionId !== 'userAddedOptions' && isChecked === true) {
          // Find option in the original field definition
            const optionExists: boolean = fieldDefinition.options?.some(
            (o: { id: number }) => o.id.toString() === optionId
            );
          
          if (!optionExists && !fieldDefinition.allowUserAddOptions) {
            return `Selected invalid option for "${fieldDefinition.title}"`;
          }
        }
      }
    }
    
    // List field validation
    else if (fieldDefinition.type === 'list') {
      const values = fieldValue as string[];
      const originalValues = fieldDefinition.values || [];
      
      if (fieldDefinition.required) {
        if (!values || values.length === 0) {
          return `Field "${fieldDefinition.title}" requires at least one entry`;
        }
        
        // If there are no original values, then the user must provide at least one non-empty value
        if (values.length <= originalValues.length) {
          // User hasn't added any new values - check if field is required
          return `Field "${fieldDefinition.title}" requires you to add at least one value`;
        }
        
        // Check if the added values are non-empty
        const userAddedValues = values.slice(originalValues.length);
        const hasNonEmptyUserValue = userAddedValues.some(val => val.trim() !== '');
        if (!hasNonEmptyUserValue) {
          return `Field "${fieldDefinition.title}" requires at least one non-empty value from you`;
        }
      }
      
      // If readonly, values shouldn't be modified
      if (fieldDefinition.readonly) {
        if (values.length !== originalValues.length) {
          return `Field "${fieldDefinition.title}" is read-only and cannot be modified`;
        }
        
        
        for (let i = 0; i < values.length; i++) {
          if (values[i] !== originalValues[i]) {
            return `Field "${fieldDefinition.title}" is read-only and cannot be modified`;
          }
        }
      }
      
      // Check max entries
      if (fieldDefinition.maxEntries && values.length > fieldDefinition.maxEntries) {
        return `Field "${fieldDefinition.title}" can have maximum ${fieldDefinition.maxEntries} entries`;
      }
      
      // Check if user is allowed to add values
      if (!fieldDefinition.allowUserAdd && values.length > (fieldDefinition.values?.length || 0)) {
        return `Field "${fieldDefinition.title}" doesn't allow adding new entries`;
      }
    }
  }
  
  return true;
};