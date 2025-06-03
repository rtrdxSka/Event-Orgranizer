import { FieldType } from '@/types';
import { z } from 'zod';

// Define types for finalization selections
export interface FinalizeSelections {
  categorySelections: Record<string, string>;
  listSelections: Record<string, string[]>;
  textSelections: Record<string, string>;
}

interface EventForValidation {
  votingCategories?: Array<{
    categoryName: string;
    options?: Array<{
      optionName: string;
      votes: string[];
      _id: string;
    }>;
    _id?: string;
  }>;
  customFields?: Record<string, {
    type: FieldType;
    title: string;
    required: boolean;
    maxEntries?: number;
    values?: string[];
    value?: string; // Add this for text field default values
    readonly?: boolean;
  }>;
  textFieldsData?: Array<{
    fieldId: string;
    categoryName: string;
    responses: Array<{
      userId: string;
      userEmail: string;
      userName?: string;
      response: string;
    }>;
  }>;
}

type VotingCategory = {
  categoryName: string;
  options?: Array<{
    optionName: string;
    votes: string[];
    _id: string;
  }>;
  _id?: string;
};

// Define the schema for validating finalization data
export const createFinalizeValidationSchema = (event: EventForValidation): z.ZodObject<Record<string, z.ZodTypeAny>> | { error: string } => {
  // Create a schema object to hold all field validations
  const schemaFields: Record<string, z.ZodTypeAny> = {};
  
  // First, process date category if it exists
  const dateCategory = event.votingCategories?.find((cat: VotingCategory) => 
    cat.categoryName.toLowerCase() === 'date'
  );
  
  if (dateCategory) {
    schemaFields.date = z.string({
      required_error: "A date must be selected for the event"
    }).min(1, "Please select a date for the event");
  }
  
  // Process place category if it exists
  const placeCategory = event.votingCategories?.find((cat: VotingCategory) => 
    cat.categoryName.toLowerCase() === 'place'
  );
  
  if (placeCategory) {
    schemaFields.place = z.string({
      required_error: "A location must be selected for the event"
    }).min(1, "Please select a location for the event");
  }
  
  // Process custom fields if they exist
  if (event.customFields) {
    for (const [fieldId, field] of Object.entries(event.customFields)) {
      // Skip empty fields
      if (!field) continue;
      
      // Get field type and required status
      const fieldType = field.type;
      const isRequired = field.required;
      
      // Skip non-required fields (optional fields don't need validation)
      if (!isRequired) continue;
      
      switch (fieldType) {
        case 'text':
          // For text fields, require a non-empty string
          schemaFields[fieldId] = z.string({
            required_error: `Field "${field.title}" requires a response`
          }).min(1, `Field "${field.title}" requires a response`);
          break;
          
        case 'radio':
          // For radio fields, require a selection
          schemaFields[fieldId] = z.string({
            required_error: `Field "${field.title}" requires a selection`
          }).min(1, `Please select an option for "${field.title}"`);
          break;
          
        case 'checkbox':
          // For checkbox fields, require at least one selection
          schemaFields[fieldId] = z.array(z.string()).min(1, {
            message: `Please select at least one option for "${field.title}"`
          });
          break;
          
case 'list':
  // For list fields, the number of selections should match maxEntries if specified
if (field.maxEntries && field.maxEntries > 0 && field.values && field.values.length > field.maxEntries) {
      return { error: `Cannot exceed ${field.maxEntries} entries` };
    } else {
      // If maxEntries is not specified, require at least one selection
      schemaFields[fieldId] = z.array(z.string()).min(1, {
        message: `Please select at least one option for "${field.title}"`
      });
    }
  break;
      }
    }
  }
  
  // Create the final schema
  return z.object(schemaFields);
};

// Function to validate the finalization data
export const validateFinalizations = (
  finalizeSelections: FinalizeSelections,
  event: EventForValidation
) => {
  if (!event) return { success: false, message: "Event data is missing" };
  
  // Extract the finalization data from the selections
  const finalizeData = prepareFinalizeData(finalizeSelections, event);
  
  // Create the validation schema
  const validationSchema = createFinalizeValidationSchema(event);

    if ('error' in validationSchema) {
    return { success: false, message: validationSchema.error };
  }
  
  // Validate the data
  const validationResult = validationSchema.safeParse(finalizeData);
  
if (!validationResult.success) {
  // Extract the first error message
  const formattedError = validationResult.error.format();
  
  // Find the first error message
  let firstErrorMessage = "Validation failed";
  for (const key in formattedError) {
    if (key !== '_errors') {
      const fieldError = formattedError[key as keyof typeof formattedError];
      if (fieldError && typeof fieldError === 'object' && '_errors' in fieldError) {
        const errors = (fieldError as { _errors: string[] })._errors;
        if (errors && errors.length > 0) {
          firstErrorMessage = errors[0];
          break;
        }
      }
    }
  }
  
  return { success: false, message: firstErrorMessage };
}
  
  return { success: true };
};

// Helper function to prepare finalization data from selections
// Helper function to prepare finalization data from selections
const prepareFinalizeData = (
  finalizeSelections: FinalizeSelections,
  event: EventForValidation
) => {
  console.log("=== VALIDATION PREPARE FINALIZE DATA ===");
  console.log("Input finalizeSelections:", finalizeSelections);
  console.log("Event customFields:", event.customFields);
  
  const { categorySelections, listSelections, textSelections } = finalizeSelections;
  
  // Initialize the data structure
  const finalizeData: Record<string, string | string[]> = {};
  
  // Extract date selection
  const dateSelection = getFinalDateSelection(categorySelections);
  if (dateSelection) {
    finalizeData.date = dateSelection;
    console.log("Added date selection:", dateSelection);
  }
  
  // Extract place selection
  const placeSelection = getFinalPlaceSelection(categorySelections);
  if (placeSelection) {
    finalizeData.place = placeSelection;
    console.log("Added place selection:", placeSelection);
  }
  
  // Process voting categories (radio & checkbox fields)
  if (event.votingCategories) {
    console.log("Processing voting categories...");
    event.votingCategories.forEach((category: VotingCategory) => {
      // Skip date and place categories
      if (category.categoryName.toLowerCase() === 'date' || 
          category.categoryName.toLowerCase() === 'place') {
        return;
      }
      
      // Find the corresponding field ID for this category
      let fieldId = '';
      if (event.customFields) {
        for (const [key, field] of Object.entries(event.customFields)) {
          if (field.title === category.categoryName) {
            fieldId = key;
            break;
          }
        }
      }
      
      if (!fieldId) return;
      
      // Collect all selections for this category
      const selections: string[] = [];
      for (const [key, value] of Object.entries(categorySelections)) {
        if (key.startsWith(`category-${category.categoryName}-`)) {
          selections.push(value);
        }
      }
      
      console.log(`Category ${category.categoryName} (${fieldId}):`, selections);
      
      // Store the selection(s)
      if (selections.length === 1 && event.customFields?.[fieldId].type === 'radio') {
        // For radio fields, store a single value
        finalizeData[fieldId] = selections[0];
        console.log(`Added radio field ${fieldId}:`, selections[0]);
      } else if (selections.length > 0 && event.customFields?.[fieldId].type === 'checkbox') {
        // For checkbox fields, store an array of values
        finalizeData[fieldId] = selections;
        console.log(`Added checkbox field ${fieldId}:`, selections);
      }
    });
  }
  
  // Process list field selections
  if (listSelections) {
    console.log("Processing list field selections:", listSelections);
    for (const [fieldId, selections] of Object.entries(listSelections)) {
      if (selections.length > 0) {
        finalizeData[fieldId] = selections;
        console.log(`Added list field ${fieldId}:`, selections);
      }
    }
  }
  
  // Process text field selections
  if (textSelections && event.customFields) {
    console.log("Processing text field selections:", textSelections);
    for (const [fieldId, selectedResponseUserId] of Object.entries(textSelections)) {
      console.log(`Processing text field ${fieldId} with userId: ${selectedResponseUserId}`);
      
      // Check if this field exists in customFields
      if (event.customFields[fieldId]) {
        if (selectedResponseUserId) {
          // Handle special case for read-only default values
          if (selectedResponseUserId === 'readonly-default') {
            console.log(`Handling readonly-default for field ${fieldId}`);
            // Get the default value directly from the field definition
            const fieldDef = event.customFields[fieldId] as { type: FieldType; value?: string };
            console.log(`Field definition:`, fieldDef);
            
            if (fieldDef && fieldDef.type === 'text') {
              // Use the field's default value or empty string
              const defaultValue = fieldDef.value || "";
              finalizeData[fieldId] = defaultValue;
              console.log(`Added readonly text field ${fieldId} with default value:`, defaultValue);
            }
          } else {
            // For regular text field responses, find the response by user ID
            const textFieldData = event.textFieldsData?.find((field) => field.fieldId === fieldId);
            console.log(`Found text field data for ${fieldId}:`, textFieldData);
            
            if (textFieldData) {
              // Find the selected response
              const selectedResponse = textFieldData.responses.find(
                (response) => response.userId === selectedResponseUserId
              );
              
              if (selectedResponse) {
                finalizeData[fieldId] = selectedResponse.response;
                console.log(`Added text field ${fieldId} with response:`, selectedResponse.response);
              }
            } else {
              // If we can't find the detailed response, just use the userId as a placeholder
              // This ensures the field is not considered empty
              const placeholder = `Selected response from user ${selectedResponseUserId}`;
              finalizeData[fieldId] = placeholder;
              console.log(`Added text field ${fieldId} with placeholder:`, placeholder);
            }
          }
        }
      } else {
        console.log(`Field ${fieldId} not found in customFields`);
      }
    }
  }
  
  console.log("Final validation data:", finalizeData);
  console.log("=== END VALIDATION PREPARE FINALIZE DATA ===");
  
  return finalizeData;
};

// Add function to check for empty optional fields
export const checkEmptyOptionalFields = (
  finalizeSelections: FinalizeSelections,
  event: EventForValidation
): { hasEmptyOptionals: boolean; emptyFields: string[] } => {
  if (!event || !event.customFields) {
    return { hasEmptyOptionals: false, emptyFields: [] };
  }
  
  const finalizeData = prepareFinalizeData(finalizeSelections, event);
  const emptyOptionalFields: string[] = [];
  
  // Check each field in the event's custom fields
  for (const [fieldId, field] of Object.entries(event.customFields)) {
    // Skip required fields - we only care about optional fields
    if (field.required) continue;
    
    // Check if this optional field is empty
    if (!(fieldId in finalizeData) || 
        finalizeData[fieldId] === undefined || 
        finalizeData[fieldId] === null || 
        finalizeData[fieldId] === "" || 
        (Array.isArray(finalizeData[fieldId]) && finalizeData[fieldId].length === 0)) {
      emptyOptionalFields.push(field.title || fieldId);
    }
  }
  
  return {
    hasEmptyOptionals: emptyOptionalFields.length > 0,
    emptyFields: emptyOptionalFields
  };
};

// Helper functions to extract values from the finalize selections
const getFinalDateSelection = (categorySelections: Record<string, string>): string | null => {
  // Look for date selection in the category selections
  for (const [key, value] of Object.entries(categorySelections)) {
    if (key.startsWith('category-date-')) {
      return value;
    }
  }
  
  return null;
};

const getFinalPlaceSelection = (categorySelections: Record<string, string>): string | null => {
  // Look for place selection in the category selections
  for (const [key, value] of Object.entries(categorySelections)) {
    if (key.startsWith('category-place-')) {
      return value;
    }
  }
  
  return null;
};