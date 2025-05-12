// Final fixed version of formatEventResponseData with improved field matching
import { EventData } from "@/lib/validations/eventSubmit.schemas";

// Helper function to generate MongoDB-like ID
function generateMongoId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counter;
}

// Interfaces for type safety
interface CustomFieldOption {
  id: number;
  label: string;
  checked?: boolean;
}

interface CustomField {
  id?: number;
  type: 'text' | 'list' | 'radio' | 'checkbox';
  title: string;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  optional?: boolean;
  value?: string;
  options?: CustomFieldOption[];
  values?: string[];
  maxEntries?: number;
  allowUserAdd?: boolean;
  maxOptions?: number;
  allowUserAddOptions?: boolean;
  selectedOption?: number | null;
}

// Helper function to find field by title
function findFieldByTitle(customFields: Record<string, any>, title: string): CustomField | undefined {
  for (const [_, field] of Object.entries(customFields)) {
    if (field.title === title) {
      return field as CustomField;
    }
  }
  return undefined;
}

export const formatEventResponseData = (
  event: EventData,
  userId: string,
  userEmail: string,
  userName: string | undefined,
  formData: {
    selectedDates: string[];
    selectedPlaces: string[];
    customFields: Record<string, any>;
  },
  suggestedDates: string[],
  suggestedPlaces: string[]
) => {
  // Create response object with the user's info
  const response = {
    eventId: event._id,
    userId,
    userEmail,
    userName,

    // Start with a copy of the event's voting categories
    votingCategories: JSON.parse(JSON.stringify(event.votingCategories)),
    
    // For non-voting fields
    fieldResponses: [],
    
    // Store suggested dates and places for backward compatibility
    suggestedDates: Array.isArray(suggestedDates) ? suggestedDates : [],
    suggestedPlaces: Array.isArray(suggestedPlaces) ? suggestedPlaces : [],
    
    // New structured approach for storing ONLY user-suggested options
    suggestedOptions: {} as Record<string, string[]>
  };

  // Process dates voting category
  const dateCategoryIndex = response.votingCategories.findIndex(
    c => c.categoryName === "date"
  );

  if (dateCategoryIndex !== -1 && Array.isArray(suggestedDates)) {
    // Add all suggested dates as options (regardless of voting)
    suggestedDates.forEach(dateStr => {
      const exists = response.votingCategories[dateCategoryIndex].options.some(
        opt => opt.optionName === dateStr
      );
      
      if (!exists) {
        const generatedId = generateMongoId();
        response.votingCategories[dateCategoryIndex].options.push({
          optionName: dateStr,
          votes: [],
          _id: generatedId
        });
      }
    });
    
    // Now add votes for selected dates
    formData.selectedDates.forEach(selectedDate => {
      const optionIndex = response.votingCategories[dateCategoryIndex].options.findIndex(
        opt => opt.optionName === selectedDate
      );

      if (optionIndex !== -1) {
        // Add user to votes array if not already there
        const votes = response.votingCategories[dateCategoryIndex].options[optionIndex].votes;
        if (!votes.includes(userId)) {
          votes.push(userId);
        }
      }
    });
  }

  // Process places voting category
  const placeCategoryIndex = response.votingCategories.findIndex(
    c => c.categoryName === "place"
  );

  if (placeCategoryIndex !== -1 && Array.isArray(suggestedPlaces)) {
    // Add all suggested places as options (regardless of voting)
    suggestedPlaces.forEach(place => {
      const exists = response.votingCategories[placeCategoryIndex].options.some(
        opt => opt.optionName === place
      );
      
      if (!exists) {
        const generatedId = generateMongoId();
        response.votingCategories[placeCategoryIndex].options.push({
          optionName: place,
          votes: [],
          _id: generatedId
        });
      }
    });
    
    // Now add votes for selected places
    formData.selectedPlaces.forEach(selectedPlace => {
      const optionIndex = response.votingCategories[placeCategoryIndex].options.findIndex(
        opt => opt.optionName === selectedPlace
      );

      if (optionIndex !== -1) {
        // Add user to votes array if not already there
        const votes = response.votingCategories[placeCategoryIndex].options[optionIndex].votes;
        if (!votes.includes(userId)) {
          votes.push(userId);
        }
      }
    });
  }

  // Process custom fields
  if (event.customFields && Object.keys(event.customFields).length > 0) {
    // Iterate through each custom field
    for (const [fieldId, fieldData] of Object.entries(event.customFields)) {
      // Always skip if field is readonly - check before accessing fieldResponse
      if (fieldData.readonly) {
        continue;
      }
      
      const fieldResponse = formData.customFields[fieldId];
      // Skip undefined/null responses
      if (fieldResponse === undefined || fieldResponse === null) {
        continue;
      }
      
      switch (fieldData.type) {
        case 'text':
          // For text fields, simply add a field response
          if (fieldData.readonly) continue;
          
          if (fieldResponse !== undefined && fieldResponse !== "") {
            response.fieldResponses.push({
              fieldId,
              type: 'text',
              response: fieldResponse
            });
          }
          break;
          
        case 'list':
          // For list fields, include ONLY user-added values
          if (fieldData.readonly) continue;
          
          const originalValues = fieldData.values || [];
          const listValues = Array.isArray(fieldResponse) ? fieldResponse : [fieldResponse];
          
          // Keep only user-added values (those beyond the original values)
          const userAddedValues = listValues.slice(originalValues.length);
          const nonEmptyUserValues = userAddedValues.filter(val => val && val.trim() !== '');
          
          if (nonEmptyUserValues.length > 0) {
            response.fieldResponses.push({
              fieldId,
              type: 'list',
              response: nonEmptyUserValues
            });
          }
          break;
          
        case 'radio':
          // For radio fields, find the right category by field title
          let categoryIndex = response.votingCategories.findIndex(
            c => c.categoryName === fieldData.title || c.categoryName === fieldId
          );
          
          if (categoryIndex === -1) {
            // Create new category if it doesn't exist
            const categoryId = generateMongoId();
            response.votingCategories.push({
              categoryName: fieldData.title || fieldId,
              options: [],
              _id: categoryId
            });
            categoryIndex = response.votingCategories.length - 1;
          }
          
          // Track ONLY user-added options
          let userAddedOptions: string[] = [];
          
          // Check if there's a userAddedOptions property in the response
          if (fieldResponse && typeof fieldResponse === 'object' && 'userAddedOptions' in fieldResponse) {
            // If there's a userAddedOptions array, include all options from it
            const userOptions = fieldResponse.userAddedOptions || [];
            if (Array.isArray(userOptions)) {
              userOptions.forEach(option => {
                if (option && typeof option === 'string' && option.trim() !== '') {
                  // Check if this option is not in the original field options
                  const isOriginalOption = fieldData.options?.some(
                    (opt: CustomFieldOption) => opt.label === option.trim()
                  ) || false;
                  
                  if (!isOriginalOption) {
                    userAddedOptions.push(option.trim());
                  }
                }
              });
            }
          }
          
          // Also check if the selected option itself is a user-added option
          const selectedValue = typeof fieldResponse === 'object' ? fieldResponse.value : fieldResponse;
          if (selectedValue && typeof selectedValue === 'string' && selectedValue.trim() !== '') {
            // Check if it's not one of the original options
            const isOriginalOption = fieldData.options?.some(
              (opt: CustomFieldOption) => opt.label === selectedValue.trim()
            ) || false;
              
            if (!isOriginalOption && !userAddedOptions.includes(selectedValue.trim())) {
              userAddedOptions.push(selectedValue.trim());
            }
          }
          
          // Store ONLY user-added options in the new structure
          if (userAddedOptions.length > 0) {
            response.suggestedOptions[fieldId] = userAddedOptions;
          }
          
          // Add all options (both original and user-added) to the category for voting purposes
          if (fieldData.allowUserAddOptions) {
            // Add original options first
            fieldData.options?.forEach((opt: CustomFieldOption) => {
              const optionExists = response.votingCategories[categoryIndex].options.some(
                existingOpt => existingOpt.optionName === opt.label
              );
              
              if (!optionExists) {
                const generatedId = generateMongoId();
                response.votingCategories[categoryIndex].options.push({
                  optionName: opt.label,
                  votes: [],
                  _id: generatedId
                });
              }
            });
            
            // Then add user-added options
            userAddedOptions.forEach(optionValue => {
              const optionExists = response.votingCategories[categoryIndex].options.some(
                opt => opt.optionName === optionValue
              );
              
              if (!optionExists) {
                const generatedId = generateMongoId();
                response.votingCategories[categoryIndex].options.push({
                  optionName: optionValue,
                  votes: [],
                  _id: generatedId
                });
              }
            });
          }
          
          // Add vote if user selected this option
          if (selectedValue) {
            const optionIndex = response.votingCategories[categoryIndex].options.findIndex(
              opt => opt.optionName === selectedValue
            );
            
            if (optionIndex !== -1) {
              // Add user to votes array if not already there
              const votes = response.votingCategories[categoryIndex].options[optionIndex].votes;
              if (!votes.includes(userId)) {
                votes.push(userId);
              }
            }
          }
          break;
          
        case 'checkbox':
          // For checkbox fields, find the right category by field title
          let checkboxCategoryIndex = response.votingCategories.findIndex(
            c => c.categoryName === fieldData.title || c.categoryName === fieldId
          );
          
          if (checkboxCategoryIndex === -1) {
            // Create new category if it doesn't exist
            const categoryId = generateMongoId();
            response.votingCategories.push({
              categoryName: fieldData.title || fieldId,
              options: [],
              _id: categoryId
            });
            checkboxCategoryIndex = response.votingCategories.length - 1;
          }
          
          // Track ONLY user-added options
          const userAddedCheckboxOptions: string[] = [];
          
          // Extract user options from the checkbox field response
          if (fieldResponse && typeof fieldResponse === 'object') {
            // If there's a userAddedOptions array, include all options from it
            if ('userAddedOptions' in fieldResponse && Array.isArray(fieldResponse.userAddedOptions)) {
              fieldResponse.userAddedOptions.forEach(option => {
                if (option && typeof option === 'string' && option.trim() !== '') {
                  // Check if this option is not in the original field options
                  const isOriginalOption = fieldData.options?.some(
                    (opt: CustomFieldOption) => opt.label === option.trim()
                  ) || false;
                  
                  if (!isOriginalOption && !userAddedCheckboxOptions.includes(option.trim())) {
                    userAddedCheckboxOptions.push(option.trim());
                  }
                }
              });
            }
            
            // Also look for user-added options in the checked items
            Object.entries(fieldResponse).forEach(([key, value]) => {
              // Skip the userAddedOptions array itself
              if (key === 'userAddedOptions') return;
              
              if (value === true) {
                let optionName;
                
                // For user-added options with ID pattern "user_something"
                if (key.startsWith('user_')) {
                  // Get original capitalization from userAddedOptions if possible
                  if (Array.isArray(fieldResponse.userAddedOptions)) {
                    // Find the original option that would create this key when transformed
                    const originalOption = fieldResponse.userAddedOptions.find(
                      option => `user_${option.replace(/\s+/g, '_').toLowerCase()}` === key
                    );
                    
                    if (originalOption) {
                      optionName = originalOption; // Use with original capitalization
                    } else {
                      // Fallback: reconstruct by removing "user_" prefix and replacing underscores with spaces
                      optionName = key.substring(5).replace(/_/g, ' ');
                    }
                  } else {
                    // If no userAddedOptions array, reconstruct from the key
                    optionName = key.substring(5).replace(/_/g, ' ');
                  }
                } else {
                  // For original options, use the key directly
                  optionName = key;
                }
                
                // Check if this is not an original option
                const isOriginalOption = fieldData.options?.some(
                  (opt: CustomFieldOption) => opt.id.toString() === key || opt.label.toLowerCase() === optionName.toLowerCase()
                ) || false;
                
                if (!isOriginalOption && !userAddedCheckboxOptions.includes(optionName)) {
                  userAddedCheckboxOptions.push(optionName);
                }
              }
            });
          }
          
          // Store ONLY user-added options in the new structure
          if (userAddedCheckboxOptions.length > 0) {
            response.suggestedOptions[fieldId] = userAddedCheckboxOptions;
          }
          
          // Add all options (both original and user-added) to the category for voting purposes
          // Add original options first
          fieldData.options?.forEach((opt: CustomFieldOption) => {
            const optionExists = response.votingCategories[checkboxCategoryIndex].options.some(
              existingOpt => existingOpt.optionName === opt.label
            );
            
            if (!optionExists) {
              const generatedId = generateMongoId();
              response.votingCategories[checkboxCategoryIndex].options.push({
                optionName: opt.label,
                votes: [],
                _id: generatedId
              });
            }
          });
          
          // Then add user-added options
          if (fieldData.allowUserAddOptions && userAddedCheckboxOptions.length > 0) {
            userAddedCheckboxOptions.forEach(optionName => {
              // Check if this option already exists in the category
              const optionExists = response.votingCategories[checkboxCategoryIndex].options.some(
                opt => opt.optionName === optionName
              );
              
              if (!optionExists) {
                // Generate a MongoDB-style ID to match existing _id format
                const generatedId = generateMongoId();
                response.votingCategories[checkboxCategoryIndex].options.push({
                  optionName: optionName,
                  votes: [], // Start with empty votes
                  _id: generatedId // Add _id field for consistency with backend
                });
              }
            });
          }
          
          // Get all checked options (both original and user-added)
const checkedOptions = [];
if (fieldResponse && typeof fieldResponse === 'object') {
  // Look through all properties except 'userAddedOptions'
  Object.entries(fieldResponse).forEach(([key, isChecked]) => {
    if (key !== 'userAddedOptions' && isChecked === true) {
      // For original options, get the label from the field definition
      if (fieldData.options) {
        const originalOption = fieldData.options.find(
          (opt: CustomFieldOption) => opt.id.toString() === key
        );
        if (originalOption) {
          checkedOptions.push(originalOption.label);
          return;
        }
      }
      
      // For user-added options (with key pattern "user_something")
      if (key.startsWith('user_')) {
        // Get original capitalization from userAddedOptions if possible
        if (Array.isArray(fieldResponse.userAddedOptions)) {
          // Find the original option that would create this key when transformed
          const originalOption = fieldResponse.userAddedOptions.find(
            option => `user_${option.replace(/\s+/g, '_').toLowerCase()}` === key
          );
          
          if (originalOption) {
            checkedOptions.push(originalOption); // Use with original capitalization
          } else {
            // Fallback: reconstruct by removing "user_" prefix and replacing underscores with spaces
            const reconstructedOption = key.substring(5).replace(/_/g, ' ');
            checkedOptions.push(reconstructedOption);
          }
        } else {
          // If no userAddedOptions array, reconstruct from the key
          const reconstructedOption = key.substring(5).replace(/_/g, ' ');
          checkedOptions.push(reconstructedOption);
        }
      }
    }
  });
}

// Now add votes for each checked option
checkedOptions.forEach(optionName => {
  const optionIndex = response.votingCategories[checkboxCategoryIndex].options.findIndex(
    opt => opt.optionName === optionName
  );
  
  if (optionIndex !== -1) {
    // Add user to votes array if not already there
    const votes = response.votingCategories[checkboxCategoryIndex].options[optionIndex].votes;
    if (!votes.includes(userId)) {
      votes.push(userId);
    }
  } else {
    // Option doesn't exist yet, add it
    const generatedId = generateMongoId();
    response.votingCategories[checkboxCategoryIndex].options.push({
      optionName: optionName,
      votes: [userId],
      _id: generatedId
    });
  }
});
          break;
      }
    }
  }
  
  return response;
};