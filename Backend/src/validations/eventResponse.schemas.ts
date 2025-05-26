// controllers/eventResponse.schemas.ts
import { z } from "zod";

// Schema for field responses (non-voting fields)
export const fieldResponseSchema = z.object({
  fieldId: z.string(),
  type: z.string(),
  response: z.any()
});

// Schema for a voting option
export const votingOptionSchema = z.object({
  optionName: z.string(),
  votes: z.array(z.string())
});

// Schema for a voting category
export const votingCategorySchema = z.object({
  categoryName: z.string(),
  options: z.array(votingOptionSchema)
});

// Main schema for event response submissions
export const createEventResponseSchema = z.object({
  eventId: z.string().min(1),
  selectedDates: z.array(z.string()),
  selectedPlaces: z.array(z.string()),
  suggestedDates: z.array(z.string()).optional(),
  suggestedPlaces: z.array(z.string()).optional(),
  customFields: z.record(z.any()),
  votingCategories: z.array(votingCategorySchema),
  suggestedOptions: z.record(z.array(z.string())).optional() 
});

export type CreateEventResponseInput = z.infer<typeof createEventResponseSchema>;

// Optional additional validation for specific field types
export const validateEventResponse = (data: CreateEventResponseInput, event: any): true | string => {
  // Validate dates
  if (data.suggestedDates?.length && !event.eventDates.allowUserAdd) {
    return "New dates cannot be added for this event";
  }
  
  if (event.eventDates.maxVotes && data.selectedDates.length > event.eventDates.maxVotes) {
    return `You can only vote for ${event.eventDates.maxVotes} dates`;
  }
  
  // Validate places
  if (data.suggestedPlaces?.length && !event.eventPlaces.allowUserAdd) {
    return "New places cannot be added for this event";
  }
  
  if (event.eventPlaces.maxVotes && data.selectedPlaces.length > event.eventPlaces.maxVotes) {
    return `You can only vote for ${event.eventPlaces.maxVotes} places`;
  }
  
  // Validate each custom field if needed
  if (event.customFields && Object.keys(event.customFields).length > 0) {
    for (const [fieldId, fieldValue] of Object.entries(data.customFields)) {
      const fieldDef = event.customFields[fieldId];
      if (!fieldDef) continue;
      
      if (fieldDef.required && 
          (fieldValue === undefined || fieldValue === null || fieldValue === "")) {
        return `Field "${fieldDef.title}" is required`;
      }
      
      // Additional type-specific validation could be added here
    }
  }
  
  return true;
};