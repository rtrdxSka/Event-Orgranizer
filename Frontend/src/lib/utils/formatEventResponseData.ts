import { EventData } from "@/lib/validations/eventSubmit.schemas";

/**
 * Format the event response to match the votingCategories structure from the event
 * and update the votes arrays with the current user's votes
 */
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

  // Process selected dates - find the date category and update votes
  if (formData.selectedDates.length > 0) {
    // Find date category in voting categories
    const dateCategoryIndex = response.votingCategories.findIndex(
      c => c.categoryName === "date"
    );

    if (dateCategoryIndex !== -1) {
      // For each selected date, check if it exists and add user's vote
      formData.selectedDates.forEach(selectedDate => {
        const optionIndex = response.votingCategories[dateCategoryIndex].options.findIndex(
          opt => opt.optionName === selectedDate
        );

        if (optionIndex !== -1) {
          // Option exists - add user to votes array if not already there
          const votes = response.votingCategories[dateCategoryIndex].options[optionIndex].votes;
          if (!votes.includes(userId)) {
            votes.push(userId);
          }
        } else if (suggestedDates.includes(selectedDate)) {
          // Option doesn't exist - create it with the user's vote
          response.votingCategories[dateCategoryIndex].options.push({
            optionName: selectedDate,
            votes: [userId]
          });
        }
      });
    }
  }

  // Process selected places - find the place category and update votes
  if (formData.selectedPlaces.length > 0) {
    // Find place category in voting categories
    const placeCategoryIndex = response.votingCategories.findIndex(
      c => c.categoryName === "place"
    );

    if (placeCategoryIndex !== -1) {
      // For each selected place, check if it exists and add user's vote
      formData.selectedPlaces.forEach(selectedPlace => {
        const optionIndex = response.votingCategories[placeCategoryIndex].options.findIndex(
          opt => opt.optionName === selectedPlace
        );

        if (optionIndex !== -1) {
          // Option exists - add user to votes array if not already there
          const votes = response.votingCategories[placeCategoryIndex].options[optionIndex].votes;
          if (!votes.includes(userId)) {
            votes.push(userId);
          }
        } else if (suggestedPlaces.includes(selectedPlace)) {
          // Option doesn't exist - create it with the user's vote
          response.votingCategories[placeCategoryIndex].options.push({
            optionName: selectedPlace,
            votes: [userId]
          });
        }
      });
    }
  }

  // Process custom fields
  if (event.customFields && Object.keys(event.customFields).length > 0) {
    // Iterate through each custom field
    for (const [fieldId, fieldData] of Object.entries(event.customFields)) {
      const fieldResponse = formData.customFields[fieldId];
      
      // Skip if field is readonly
      if (fieldData.readonly) continue;
      
      // Skip if no response and field is optional
      if (fieldResponse === undefined || fieldResponse === "" || 
          (Array.isArray(fieldResponse) && fieldResponse.length === 0) ||
          (typeof fieldResponse === 'object' && fieldResponse !== null && Object.keys(fieldResponse).length === 0)) {
        if (!fieldData.required) continue;
      }
      
      switch (fieldData.type) {
        case 'text':
          // For text fields, simply add a field response
          response.fieldResponses.push({
            fieldId,
            type: 'text',
            response: fieldResponse
          });
          break;
          
        case 'list':
          // For list fields, only include user-added values
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
          // For radio fields, add to voting categories
          if (fieldResponse) {
            // Find or create voting category for this field
            let categoryIndex = response.votingCategories.findIndex(
              c => c.categoryName === fieldId
            );
            
            if (categoryIndex === -1) {
              // Create new category if it doesn't exist
              if (fieldData.allowUserAddOptions) {
                response.votingCategories.push({
                  categoryName: fieldId,
                  options: []
                });
                categoryIndex = response.votingCategories.length - 1;
              }
            }
            
            if (categoryIndex !== -1) {
              // Check if option exists
              const optionIndex = response.votingCategories[categoryIndex].options.findIndex(
                opt => opt.optionName === fieldResponse
              );
              
              if (optionIndex !== -1) {
                // Option exists - add user to votes array if not already there
                const votes = response.votingCategories[categoryIndex].options[optionIndex].votes;
                if (!votes.includes(userId)) {
                  votes.push(userId);
                }
              } else if (fieldData.allowUserAddOptions) {
                // Option doesn't exist - create it with the user's vote
                response.votingCategories[categoryIndex].options.push({
                  optionName: fieldResponse,
                  votes: [userId]
                });
              }
            }
          }
          break;
          
        case 'checkbox':
          // For checkbox fields, process checked options
          const checkedOptions = Object.entries(fieldResponse || {})
            .filter(([_, isChecked]) => isChecked === true)
            .map(([optionId, _]) => optionId);
            
          if (checkedOptions.length > 0) {
            // Find or create voting category for this field
            let categoryIndex = response.votingCategories.findIndex(
              c => c.categoryName === fieldId
            );
            
            if (categoryIndex === -1) {
              // Create new category if it doesn't exist
              if (fieldData.allowUserAddOptions) {
                response.votingCategories.push({
                  categoryName: fieldId,
                  options: []
                });
                categoryIndex = response.votingCategories.length - 1;
              }
            }
            
            if (categoryIndex !== -1) {
              // For each checked option, check if it exists and add user's vote
              checkedOptions.forEach(optionId => {
                const optionIndex = response.votingCategories[categoryIndex].options.findIndex(
                  opt => opt.optionName === optionId
                );
                
                if (optionIndex !== -1) {
                  // Option exists - add user to votes array if not already there
                  const votes = response.votingCategories[categoryIndex].options[optionIndex].votes;
                  if (!votes.includes(userId)) {
                    votes.push(userId);
                  }
                } else if (fieldData.allowUserAddOptions) {
                  // Option doesn't exist - create it with the user's vote
                  response.votingCategories[categoryIndex].options.push({
                    optionName: optionId,
                    votes: [userId]
                  });
                }
              });
            }
          }
          break;
      }
    }
  }
  
  return response;
};