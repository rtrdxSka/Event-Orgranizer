// utils/eventResponse.validation.ts
import { z } from 'zod';
import { CreateEventResponseInput } from './eventResponse.schemas';
import { EventDocument } from '../models/event.model';
import { BAD_REQUEST } from '../constants/http';
import appAssert from '../utils/appAssert';

// Define validation result type
export interface ValidationResult {
  success: boolean;
  message: string;
  data?: CreateEventResponseInput;
}

/**
 * Validates event response data structure and throws error if invalid
 * @param data The event response data to validate
 * @param event The event document (not used in basic validation but kept for compatibility)
 * @throws AppError if validation fails
 */
export const validateEventResponseDataOrThrow = (
  data: CreateEventResponseInput, 
  event: EventDocument
): void => {
  const result = validateEventResponseData(data, event);
  
  if (!result.success) {
    appAssert(false, BAD_REQUEST, result.message);
  }
};

/**
 * Validates event response data structure only
 * @param data The event response data to validate
 * @param event The event document (not used in basic validation but kept for compatibility)
 * @returns ValidationResult object
 */
export const validateEventResponseData = (
  data: CreateEventResponseInput, 
  event: EventDocument
): ValidationResult => {
  try {
    // Only validate basic structure
    return validateBasicStructure(data);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Validation failed',
    };
  }
};

/**
 * Validates basic structure and required fields only
 */
const validateBasicStructure = (data: CreateEventResponseInput): ValidationResult => {
  // Validate that eventId is provided
  if (!data.eventId || typeof data.eventId !== 'string' || data.eventId.trim() === '') {
    return {
      success: false,
      message: "Event ID is required"
    };
  }

  // Validate that at least one date is selected
  if (!data.selectedDates || !Array.isArray(data.selectedDates) || data.selectedDates.length === 0) {
    return {
      success: false,
      message: "You must vote for at least one date"
    };
  }

  // Validate that at least one place is selected
  if (!data.selectedPlaces || !Array.isArray(data.selectedPlaces) || data.selectedPlaces.length === 0) {
    return {
      success: false,
      message: "You must vote for at least one place"
    };
  }

  // Validate that selectedDates contains valid strings
  for (const date of data.selectedDates) {
    if (typeof date !== 'string' || date.trim() === '') {
      return {
        success: false,
        message: "All selected dates must be valid strings"
      };
    }
  }

  // Validate that selectedPlaces contains valid strings
  for (const place of data.selectedPlaces) {
    if (typeof place !== 'string' || place.trim() === '') {
      return {
        success: false,
        message: "All selected places must be valid strings"
      };
    }
  }

  // Validate suggestedDates if provided
  if (data.suggestedDates !== undefined) {
    if (!Array.isArray(data.suggestedDates)) {
      return {
        success: false,
        message: "Suggested dates must be an array"
      };
    }
    
    for (const date of data.suggestedDates) {
      if (typeof date !== 'string' || date.trim() === '') {
        return {
          success: false,
          message: "All suggested dates must be valid strings"
        };
      }
    }
  }

  // Validate suggestedPlaces if provided
  if (data.suggestedPlaces !== undefined) {
    if (!Array.isArray(data.suggestedPlaces)) {
      return {
        success: false,
        message: "Suggested places must be an array"
      };
    }
    
    for (const place of data.suggestedPlaces) {
      if (typeof place !== 'string' || place.trim() === '') {
        return {
          success: false,
          message: "All suggested places must be valid strings"
        };
      }
    }
  }

  // Validate votingCategories if provided
  if (data.votingCategories !== undefined) {
    if (!Array.isArray(data.votingCategories)) {
      return {
        success: false,
        message: "Voting categories must be an array"
      };
    }
    
    for (const category of data.votingCategories) {
      if (!category.categoryName || typeof category.categoryName !== 'string') {
        return {
          success: false,
          message: "Each voting category must have a valid category name"
        };
      }
      
      if (!Array.isArray(category.options)) {
        return {
          success: false,
          message: "Each voting category must have an options array"
        };
      }
      
      for (const option of category.options) {
        if (!option.optionName || typeof option.optionName !== 'string') {
          return {
            success: false,
            message: "Each voting option must have a valid option name"
          };
        }
        
        if (!Array.isArray(option.votes)) {
          return {
            success: false,
            message: "Each voting option must have a votes array"
          };
        }
      }
    }
  }

  // Validate customFields if provided
  if (data.customFields !== undefined) {
    if (typeof data.customFields !== 'object' || data.customFields === null) {
      return {
        success: false,
        message: "Custom fields must be an object"
      };
    }
  }

  // Validate suggestedOptions if provided
  if (data.suggestedOptions !== undefined) {
    if (typeof data.suggestedOptions !== 'object' || data.suggestedOptions === null) {
      return {
        success: false,
        message: "Suggested options must be an object"
      };
    }
    
    // Each key should map to an array of strings
    for (const [key, value] of Object.entries(data.suggestedOptions)) {
      if (!Array.isArray(value)) {
        return {
          success: false,
          message: `Suggested options for "${key}" must be an array`
        };
      }
      
      for (const option of value) {
        if (typeof option !== 'string' || option.trim() === '') {
          return {
            success: false,
            message: `All suggested options for "${key}" must be valid strings`
          };
        }
      }
    }
  }

  return {
    success: true,
    message: "Basic structure is valid",
    data
  };
};