import { z } from "zod";

// Schema for finalization selections
export const finalizationSelectionsSchema = z.object({
  date: z.string().nullable().optional()
    .refine(val => {
      if (!val) return true; // Allow null/undefined
      
      // Check if it's a valid ISO date string
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, {
      message: "Date must be a valid ISO date string"
    }),
  
  place: z.string().nullable().optional()
    .refine(val => {
      if (!val) return true; // Allow null/undefined
      return val.trim().length > 0;
    }, {
      message: "Place cannot be empty if provided"
    }),
    
  customFields: z.record(z.any()).optional().default({})
});

export type FinalizationSelections = z.infer<typeof finalizationSelectionsSchema>;

// Validation function that checks business logic rules
export const validateFinalizations = (
  selections: FinalizationSelections,
  event: any // Event document
): { success: boolean; message: string } => {
  try {
    // First validate the basic structure
    const validationResult = finalizationSelectionsSchema.safeParse(selections);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return {
        success: false,
        message: `Validation error: ${firstError.message} at ${firstError.path.join('.')}`
      };
    }

    // Check if event has date voting and a date selection is required
    const hasDateVoting = event.votingCategories?.some((cat: any) => 
      cat.categoryName === 'date' && cat.options && cat.options.length > 0
    );
    
    if (hasDateVoting && !selections.date) {
      return {
        success: false,
        message: "A date must be selected when the event has date voting options"
      };
    }

    // Check if event has place voting and a place selection is required
    const hasPlaceVoting = event.votingCategories?.some((cat: any) => 
      cat.categoryName === 'place' && cat.options && cat.options.length > 0
    );
    
    if (hasPlaceVoting && !selections.place) {
      return {
        success: false,
        message: "A place must be selected when the event has place voting options"
      };
    }

    // Validate date exists in event's available dates
    if (selections.date && hasDateVoting) {
      const dateCategory = event.votingCategories?.find((cat: any) => cat.categoryName === 'date');
      const availableDates = dateCategory?.options?.map((opt: any) => opt.optionName) || [];
      
      if (!availableDates.includes(selections.date)) {
        return {
          success: false,
          message: "Selected date is not available in the event's date options"
        };
      }
    }

    // Validate place exists in event's available places
    if (selections.place && hasPlaceVoting) {
      const placeCategory = event.votingCategories?.find((cat: any) => cat.categoryName === 'place');
      const availablePlaces = placeCategory?.options?.map((opt: any) => opt.optionName) || [];
      
      if (!availablePlaces.includes(selections.place)) {
        return {
          success: false,
          message: "Selected place is not available in the event's place options"
        };
      }
    }

    // Validate custom field selections
    if (selections.customFields && Object.keys(selections.customFields).length > 0) {
      for (const [fieldId, selection] of Object.entries(selections.customFields)) {
        // Get field definition from event
        const fieldDef = event.customFields?.get ? 
          event.customFields.get(fieldId) : 
          event.customFields?.[fieldId];
        
        if (!fieldDef) {
          return {
            success: false,
            message: `Custom field ${fieldId} not found in event definition`
          };
        }

        // Validate required fields have selections
        if (fieldDef.required && (!selection || 
            (typeof selection === 'string' && selection.trim() === '') ||
            (Array.isArray(selection) && selection.length === 0))) {
          return {
            success: false,
            message: `Required field "${fieldDef.title}" must have a selection`
          };
        }

        // For voting fields (radio, checkbox), validate selection exists in voting categories
        if (fieldDef.type === 'radio' || fieldDef.type === 'checkbox') {
          const categoryName = fieldDef.title;
          const category = event.votingCategories?.find((cat: any) => cat.categoryName === categoryName);
          
          if (category) {
            const availableOptions = category.options?.map((opt: any) => opt.optionName) || [];
            
            if (fieldDef.type === 'radio') {
              // Single selection for radio
              if (selection && !availableOptions.includes(selection)) {
                return {
                  success: false,
                  message: `Selected option "${selection}" is not available for field "${fieldDef.title}"`
                };
              }
            } else if (fieldDef.type === 'checkbox') {
              // Multiple selections for checkbox
              if (Array.isArray(selection)) {
                for (const option of selection) {
                  if (!availableOptions.includes(option)) {
                    return {
                      success: false,
                      message: `Selected option "${option}" is not available for field "${fieldDef.title}"`
                    };
                  }
                }
              }
            }
          }
        }

        // For list fields, validate selections exist in available options
        if (fieldDef.type === 'list' && Array.isArray(selection)) {
          // Find corresponding list field data to validate options
          const category = event.votingCategories?.find((cat: any) => cat.categoryName === fieldDef.title);
          if (category) {
            const availableOptions = category.options?.map((opt: any) => opt.optionName) || [];
            
            for (const option of selection) {
              if (!availableOptions.includes(option)) {
                return {
                  success: false,
                  message: `Selected list option "${option}" is not available for field "${fieldDef.title}"`
                };
              }
            }
          }
        }
      }
    }

    return {
      success: true,
      message: "All validations passed"
    };

  } catch (error) {
    return {
      success: false,
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Define the field definition interface
interface CustomFieldDef {
  required: boolean;
  readonly?: boolean;
  title?: string;
  type?: string;
}

// Function to check for empty optional fields (useful for warnings)
export const checkEmptyOptionalFields = (
  selections: FinalizationSelections,
  event: any
): { hasEmptyOptionals: boolean; emptyFields: string[] } => {
  const emptyFields: string[] = [];

  if (event.customFields) {
    // Convert Map to object if needed
    const customFieldsObj = event.customFields instanceof Map 
      ? Object.fromEntries(event.customFields.entries()) 
      : event.customFields;

    for (const [fieldId, fieldDef] of Object.entries(customFieldsObj) as [string, CustomFieldDef][]) {
      // Only check optional fields (not required and not readonly)
      if (!fieldDef.required && !fieldDef.readonly) {
        const selection = selections.customFields?.[fieldId];
        
        if (!selection || 
            (typeof selection === 'string' && selection.trim() === '') ||
            (Array.isArray(selection) && selection.length === 0)) {
          emptyFields.push(fieldDef.title || fieldId);
        }
      }
    }
  }

  return {
    hasEmptyOptionals: emptyFields.length > 0,
    emptyFields
  };
};

// Request body schema for the finalization endpoint
export const finalizeEventRequestSchema = z.object({
  date: z.string().nullable().optional(),
  place: z.string().nullable().optional(),
  customFields: z.record(z.any()).optional().default({})
});

export type FinalizeEventRequest = z.infer<typeof finalizeEventRequestSchema>;