import { EventData } from "../validations/eventSubmit.schemas";

// Helper function to generate MongoDB-like ID
// This creates a 24-character hexadecimal string similar to MongoDB ObjectId
function generateMongoId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counter;
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
    fieldResponses: []
  };

  // Process dates - add all suggested dates to the date category
  const dateCategoryIndex = response.votingCategories.findIndex(
    c => c.categoryName === "date"
  );

  if (dateCategoryIndex !== -1) {
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

  // Process places - add all suggested places to the place category
  const placeCategoryIndex = response.votingCategories.findIndex(
    c => c.categoryName === "place"
  );

  if (placeCategoryIndex !== -1) {
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
      const fieldResponse = formData.customFields[fieldId];
      
      // Skip if field is readonly
      if (fieldData.readonly) continue;
      
      switch (fieldData.type) {
        case 'text':
          // For text fields, simply add a field response
          if (fieldResponse !== undefined && fieldResponse !== "") {
            response.fieldResponses.push({
              fieldId,
              type: 'text',
              response: fieldResponse
            });
          }
          break;
          
        case 'list':
          // For list fields, include all user-added values
          const originalValues = fieldData.values || [];
          const listValues = Array.isArray(fieldResponse) ? fieldResponse : [fieldResponse];
          
          // Keep only user-added values
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
          
          // FIXED: First check if the field has any user-added options
          // The field custom data structure may contain user-added options that didn't come from the original options
          // These would be stored in a different structure from the original form
          
          // Get all possible user-added options (regardless if selected)
          const userAddedOptions = [];
          
          // Check if there's a userAddedOptions property in the response
          if (fieldResponse && typeof fieldResponse === 'object' && 'userAddedOptions' in fieldResponse) {
            // If there's a userAddedOptions array, include all options from it
            const userOptions = fieldResponse.userAddedOptions || [];
            if (Array.isArray(userOptions)) {
              userOptions.forEach(option => {
                if (option && typeof option === 'string' && option.trim() !== '') {
                  userAddedOptions.push(option.trim());
                }
              });
            }
          }
          
          // Also check if the selected option itself is a user-added option
          const selectedValue = typeof fieldResponse === 'object' ? fieldResponse.value : fieldResponse;
          if (selectedValue && typeof selectedValue === 'string' && selectedValue.trim() !== '') {
            // Check if it's not one of the original options
            const isUserAdded = fieldData.options ? 
              !fieldData.options.some(opt => opt.label === selectedValue) : true;
              
            if (isUserAdded && !userAddedOptions.includes(selectedValue)) {
              userAddedOptions.push(selectedValue);
            }
          }
          
          // Add all user-added options to the category (regardless of voting)
          if (fieldData.allowUserAddOptions) {
            userAddedOptions.forEach(optionValue => {
              // First check if this option already exists in the category
              const optionExists = response.votingCategories[categoryIndex].options.some(
                opt => opt.optionName === optionValue
              );
              
              if (!optionExists) {
                // Generate a MongoDB-style ID to match existing _id format
                const generatedId = generateMongoId();
                response.votingCategories[categoryIndex].options.push({
                  optionName: optionValue,
                  votes: [], // Start with empty votes
                  _id: generatedId // Add _id field for consistency with backend
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
          
          // Track all user-added options, not just checked ones
          const allUserOptions = [];
          
          // Extract user options from the checkbox field response
          if (fieldResponse && typeof fieldResponse === 'object') {
            // If there's a userAddedOptions array, include all options from it
            if ('userAddedOptions' in fieldResponse && Array.isArray(fieldResponse.userAddedOptions)) {
              fieldResponse.userAddedOptions.forEach(option => {
                if (option && typeof option === 'string' && option.trim() !== '' && !allUserOptions.includes(option)) {
                  allUserOptions.push(option);
                }
              });
            }
            
            // Also look for user-added options in the checked items
            Object.entries(fieldResponse).forEach(([key, value]) => {
              // Skip the userAddedOptions array itself
              if (key === 'userAddedOptions') return;
              
              if (value === true) {
                // Check if this is a user-added option (i.e., not found in original options)
                const isUserOption = fieldData.options ? 
                  !fieldData.options.some(opt => opt.id.toString() === key) : true;
                
                if (isUserOption) {
                  // The key here might be complex - extract proper option name
                  // Check if it's a simple string that can be used as an option name
                  const optionName = key.split('_').length > 1 ? key.split('_')[1] : key;
                  
                  if (!allUserOptions.includes(optionName)) {
                    allUserOptions.push(optionName);
                  }
                }
              }
            });
          }
          
          // Add all user-added options to the category (regardless of if checked)
          if (fieldData.allowUserAddOptions && allUserOptions.length > 0) {
            allUserOptions.forEach(optionName => {
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
                  const originalOption = fieldData.options.find(opt => opt.id.toString() === key);
                  if (originalOption) {
                    checkedOptions.push(originalOption.label);
                    return;
                  }
                }
                
                // For user-added options, use the key itself or extract from it
                const optionName = key.split('_').length > 1 ? key.split('_')[1] : key;
                checkedOptions.push(optionName);
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