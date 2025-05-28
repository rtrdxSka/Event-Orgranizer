import React, { useEffect, useState } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SuggestionDropdown from './SuggestionDropdown';
import PaginatedSuggestionDropdown from './PaginatedSuggestionDropdown';

// Types for custom fields
export type CustomFieldData = {
  id: string;
  type: string;
  title: string;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  optional?: boolean;
  value?: string;
  options?: Array<{
    id: number;
    label: string;
    checked?: boolean;
  }>;
  values?: string[];
  maxEntries?: number;
  allowUserAdd?: boolean;
};

interface CustomFieldProps {
  field: CustomFieldData;
  formMethods: UseFormReturn<any>;
  suggestions?: string[]; // Added suggestions prop
}

// Text Field Component
export const TextField: React.FC<CustomFieldProps> = ({ 
  field, 
  formMethods,
  suggestions 
}) => {
  const { control } = formMethods;
  const fieldId = `customFields.${field.id}`;
  
  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    formMethods.setValue(fieldId, suggestion);
  };
  
  return (
    <div className="bg-purple-800/30 rounded-lg p-4 mb-4">
      <Label 
        htmlFor={fieldId} 
        className="text-purple-100 mb-2 block font-medium text-lg"
      >
        {field.title}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      
      <Controller
        name={fieldId}
        control={control}
        defaultValue={field.value || ''}
        render={({ field: inputField }) => (
          <Input
            id={fieldId}
            {...inputField}
            placeholder={field.placeholder}
            readOnly={field.readonly}
            className="bg-purple-800/50 border-purple-600 text-purple-100"
          />
        )}
      />
      
      {/* Display suggestions dropdown if there are suggestions and field is not readonly */}
{!field.readonly && suggestions && suggestions.length > 0 && (
  <PaginatedSuggestionDropdown
    fieldId={field.id}
    fieldTitle={field.title}
    suggestions={suggestions}
    onSelect={handleSelectSuggestion}
    type="custom"
    hasMore={false} // Custom fields don't support pagination yet
    isLoadingMore={false}
    onLoadMore={() => {}} // No-op for custom fields
    totalLoaded={suggestions.length}
    maxSuggestions={100}
  />
)}
    </div>
  );
};

// Radio Field Component
export const RadioField: React.FC<CustomFieldProps> = ({ 
  field, 
  formMethods,
  suggestions
}) => {
  const { control, setValue, watch } = formMethods;
  const fieldId = `customFields.${field.id}`;
  const [newOption, setNewOption] = useState('');
  
  // Track user-added options separately
  const [userAddedOptions, setUserAddedOptions] = useState<Array<{id: number, label: string}>>([]);
  const formValue = watch(fieldId) || { value: '', userAddedOptions: [] };
  
  // Initialize userAddedOptions from form state on mount
  useEffect(() => {
    const currentValue = watch(fieldId);
    if (currentValue?.userAddedOptions && Array.isArray(currentValue.userAddedOptions)) {
      const options = currentValue.userAddedOptions.map((label, index) => ({
        id: `user_${label.replace(/\s+/g, '_').toLowerCase()}`,
        label
      }));
      setUserAddedOptions(options);
    }
  }, [watch(fieldId)]);
  
  const allOptions = [...(field.options || []), ...userAddedOptions];
  const hasReachedMaxOptions = field.maxOptions && allOptions.length >= field.maxOptions;

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    // Check if suggestion already exists
    const optionExists = allOptions.some(opt => 
      opt.label.toLowerCase() === suggestion.toLowerCase()
    );
    
    if (!optionExists && field.allowUserAddOptions && !hasReachedMaxOptions) {
      // Add as a new option
      const newId = Date.now();
      const newUserOption = { id: newId, label: suggestion };
      
      // Update local state
      setUserAddedOptions([...userAddedOptions, newUserOption]);
      
      // Update form state
      const updatedUserOptions = [...(formValue.userAddedOptions || []), suggestion];
      
      setValue(fieldId, {
        ...formValue,
        value: suggestion, // Also select the newly added option
        userAddedOptions: updatedUserOptions
      });
    } else if (optionExists) {
      // If option already exists, just select it
      setValue(fieldId, {
        ...formValue,
        value: suggestion
      });
    }
  };
  
  // Add a new option
  const handleAddOption = () => {
    if (newOption.trim() && field.allowUserAddOptions && !hasReachedMaxOptions) {
      // Check if option already exists
      const optionExists = allOptions.some(opt => 
        opt.label.toLowerCase() === newOption.trim().toLowerCase()
      );
      
      if (optionExists) {
        alert('This option already exists');
        return;
      }
      
      const newId = Date.now();
      const newUserOption = { id: newId, label: newOption.trim() };
      
      // Update our local state to track this option
      setUserAddedOptions([...userAddedOptions, newUserOption]);
      
      // Update the form data to track all user-added options
      const updatedUserOptions = [...(formValue.userAddedOptions || []), newOption.trim()];
      
      setValue(fieldId, {
        ...formValue,
        userAddedOptions: updatedUserOptions
      });
      
      setNewOption('');
    }
  };
  
  // Remove a user-added option
  const handleRemoveOption = (id: number) => {
    // Find the option being removed
    const optionBeingRemoved = userAddedOptions.find(opt => opt.id === id);
    
    if (optionBeingRemoved) {
      // Update our local state
      setUserAddedOptions(userAddedOptions.filter(opt => opt.id !== id));
      
      // Update the form value
      const updatedUserOptions = (formValue.userAddedOptions || [])
        .filter(option => option !== optionBeingRemoved.label);
      
      // If currently selected value is being removed, clear selection
      const newValue = formValue.value === optionBeingRemoved.label ? '' : formValue.value;
      
      setValue(fieldId, {
        value: newValue,
        userAddedOptions: updatedUserOptions
      });
    }
  };
  
  // Handle option selection
  const handleOptionSelect = (value: string) => {
    // Update the form value with the selected option
    setValue(fieldId, {
      ...formValue,
      value
    });
  };
  
  return (
    <div className="bg-purple-800/30 rounded-lg p-4 mb-4">
      <Label className="text-purple-100 mb-3 block font-medium text-lg">
        {field.title}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      
      <div className="space-y-2">
        {/* Original options */}
        {(field.options || []).map((option) => (
          <div key={`original-${option.id}`} className="flex items-center space-x-2 p-2 bg-purple-800/40 rounded">
            <input
              type="radio"
              id={`${fieldId}-${option.id}`}
              checked={formValue.value === option.label}
              onChange={() => handleOptionSelect(option.label)}
              className="text-purple-600 border-purple-400 bg-purple-800/50"
            />
            <Label 
              htmlFor={`${fieldId}-${option.id}`} 
              className="text-purple-100"
            >
              {option.label}
            </Label>
          </div>
        ))}
        
        {/* User-added options */}
        {userAddedOptions.map((option) => (
          <div key={`user-${option.id}`} className="flex items-center justify-between p-2 bg-purple-700/40 rounded border border-purple-500/30">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${fieldId}-${option.id}`}
                checked={formValue.value === option.label}
                onChange={() => handleOptionSelect(option.label)}
                className="text-purple-600 border-purple-400 bg-purple-800/50"
              />
              <Label 
                htmlFor={`${fieldId}-${option.id}`} 
                className="text-purple-100"
              >
                {option.label}
              </Label>
              <span className="ml-2 px-2 py-0.5 bg-purple-600/50 text-purple-200 rounded text-xs">Your suggestion</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveOption(option.id)}
              className="text-red-300 hover:text-red-200 hover:bg-red-800/30"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      {/* Add new option input */}
      {field.allowUserAddOptions && (
        <div className="mt-4 pt-3 border-t border-purple-600/30">
          <h4 className="text-sm font-medium text-purple-200 mb-2">
            Add Your Own Option
          </h4>
          
          {!hasReachedMaxOptions ? (
            <div className="flex items-center gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Enter a new option"
                className="bg-purple-800/50 border-purple-600 text-purple-100"
              />
              <Button
                type="button"
                onClick={handleAddOption}
                disabled={!newOption.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          ) : (
            <p className="text-amber-400 text-sm mt-1">
              Maximum options reached ({field.maxOptions})
            </p>
          )}
        </div>
      )}
      
      {/* Suggestions from other users */}
{!field.readonly && suggestions && suggestions.length > 0 && (
  <PaginatedSuggestionDropdown
    fieldId={field.id}
    fieldTitle={field.title}
    suggestions={suggestions}
    onSelect={handleSelectSuggestion}
    type="custom"
    hasMore={false} // Custom fields don't support pagination yet
    isLoadingMore={false}
    onLoadMore={() => {}} // No-op for custom fields
    totalLoaded={suggestions.length}
    maxSuggestions={100}
  />
)}
    </div>
  );
};

// Improved Checkbox Field Component
export const CheckboxField: React.FC<CustomFieldProps> = ({ 
  field, 
  formMethods,
  suggestions 
}) => {
  const { setValue, watch } = formMethods;
  const fieldId = `customFields.${field.id}`;
  const [newOption, setNewOption] = useState('');

  // Track user-added options in local state
  const [userAddedOptions, setUserAddedOptions] = useState<Array<{id: string, label: string}>>([]);
  
  // Watch the form value
  const formValue = watch(fieldId) || { userAddedOptions: [] };
  
  // Initialize userAddedOptions from form state on mount
  useEffect(() => {
    const currentValue = watch(fieldId);
    if (currentValue?.userAddedOptions && Array.isArray(currentValue.userAddedOptions)) {
      const options = currentValue.userAddedOptions.map(label => {
        const id = `user_${label.replace(/\s+/g, '_').toLowerCase()}`;
        return { id, label };
      });
      setUserAddedOptions(options);
    }
  }, [watch(fieldId)]);
  
  // Calculate if we've reached max options
  const allOptions = [
    ...(field.options || []),
    ...userAddedOptions
  ];
  const hasReachedMaxOptions = field.maxOptions && allOptions.length >= field.maxOptions;

  // Handle adding a new option
  const handleAddOption = () => {
    if (!newOption.trim() || !field.allowUserAddOptions || hasReachedMaxOptions) return;
    
    // Check if option already exists
    const optionExists = allOptions.some(opt => 
      opt.label.toLowerCase() === newOption.trim().toLowerCase()
    );
    
    if (optionExists) {
      alert('This option already exists');
      return;
    }
    
    // Create a stable ID for this option
    const optionLabel = newOption.trim();
    const optionId = `user_${optionLabel.replace(/\s+/g, '_').toLowerCase()}`;
    
    // Add to local state
    const newUserOption = { id: optionId, label: optionLabel };
    setUserAddedOptions([...userAddedOptions, newUserOption]);
    
    // Update form value - add to userAddedOptions array and initialize as unchecked
    const updatedUserOptions = [...(formValue.userAddedOptions || []), optionLabel];
    const updatedFormValue = {
      ...formValue,
      userAddedOptions: updatedUserOptions
    };
    updatedFormValue[optionId] = false; // Initialize as unchecked
    
    setValue(fieldId, updatedFormValue);
    setNewOption('');
  };
  
  // Handle removing a user-added option
  const handleRemoveOption = (option: {id: string, label: string}) => {
    // Remove from local state
    setUserAddedOptions(userAddedOptions.filter(opt => opt.id !== option.id));
    
    // Update form value
    const updatedFormValue = { ...formValue };
    
    // Remove from userAddedOptions array
    if (updatedFormValue.userAddedOptions) {
      updatedFormValue.userAddedOptions = updatedFormValue.userAddedOptions.filter(
        label => label !== option.label
      );
    }
    
    // Remove the option's checked property
    delete updatedFormValue[option.id];
    
    setValue(fieldId, updatedFormValue);
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (optionId: string, checked: boolean) => {
    const updatedFormValue = { ...formValue };
    updatedFormValue[optionId] = checked;
    setValue(fieldId, updatedFormValue);
  };
  
  // Handle selecting a suggestion from other users
  const handleSelectSuggestion = (suggestion: string) => {
    // Check if the suggestion already exists
    const optionExists = allOptions.some(opt => 
      opt.label.toLowerCase() === suggestion.toLowerCase()
    );
    
    if (!optionExists && field.allowUserAddOptions && !hasReachedMaxOptions) {
      // Create a stable ID for this option
      const optionId = `user_${suggestion.replace(/\s+/g, '_').toLowerCase()}`;
      
      // Add to local state
      const newUserOption = { id: optionId, label: suggestion };
      setUserAddedOptions([...userAddedOptions, newUserOption]);
      
      // Update form value - add to userAddedOptions array and initialize as checked
      const updatedUserOptions = [...(formValue.userAddedOptions || []), suggestion];
      const updatedFormValue = {
        ...formValue,
        userAddedOptions: updatedUserOptions
      };
      updatedFormValue[optionId] = true; // Initialize as checked
      
      setValue(fieldId, updatedFormValue);
    } else if (optionExists) {
      // If option already exists, find its ID
      const existingOption = allOptions.find(opt => 
        opt.label.toLowerCase() === suggestion.toLowerCase()
      );
      
      if (existingOption) {
        const optionId = typeof existingOption.id === 'number' 
          ? existingOption.id.toString() 
          : existingOption.id;
        
        // Toggle the checkbox
        const currentValue = formValue[optionId] || false;
        handleCheckboxChange(optionId, !currentValue);
      }
    }
  };
  
  return (
    <div className="bg-purple-800/30 rounded-lg p-4 mb-4">
      <Label className="text-purple-100 mb-3 block font-medium text-lg">
        {field.title}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      
      <div className="space-y-2">
        {/* Original options */}
        {(field.options || []).map((option) => {
          const optionId = option.id.toString();
          const isChecked = formValue[optionId] === true;
          
          return (
            <div key={`original-${option.id}`} className="flex items-center space-x-2 p-2 bg-purple-800/40 rounded">
              <input
                type="checkbox"
                id={`${fieldId}-${optionId}`}
                checked={isChecked}
                onChange={(e) => handleCheckboxChange(optionId, e.target.checked)}
                className="rounded text-purple-600 border-purple-400 bg-purple-800/50 focus:ring-purple-500 focus:ring-offset-purple-900"
              />
              <Label 
                htmlFor={`${fieldId}-${optionId}`} 
                className="text-purple-100"
              >
                {option.label}
              </Label>
            </div>
          );
        })}
        
        {/* User-added options */}
        {userAddedOptions.map((option) => {
          const isChecked = formValue[option.id] === true;
          
          return (
            <div key={`user-${option.id}`} className="flex items-center justify-between p-2 bg-purple-700/40 rounded border border-purple-500/30">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${fieldId}-${option.id}`}
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(option.id, e.target.checked)}
                  className="rounded text-purple-600 border-purple-400 bg-purple-800/50 focus:ring-purple-500 focus:ring-offset-purple-900"
                />
                <Label 
                  htmlFor={`${fieldId}-${option.id}`} 
                  className="text-purple-100"
                >
                  {option.label}
                </Label>
                <span className="ml-2 px-2 py-0.5 bg-purple-600/50 text-purple-200 rounded text-xs">Your suggestion</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(option)}
                className="text-red-300 hover:text-red-200 hover:bg-red-800/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
      
      {/* Add new option input */}
      {field.allowUserAddOptions && (
        <div className="mt-4 pt-3 border-t border-purple-600/30">
          <h4 className="text-sm font-medium text-purple-200 mb-2">
            Add Your Own Option
          </h4>
          
          {!hasReachedMaxOptions ? (
            <div className="flex items-center gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Enter a new option"
                className="bg-purple-800/50 border-purple-600 text-purple-100"
              />
              <Button
                type="button"
                onClick={handleAddOption}
                disabled={!newOption.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          ) : (
            <p className="text-amber-400 text-sm mt-1">
              Maximum options reached ({field.maxOptions})
            </p>
          )}
        </div>
      )}
      
      {/* Suggestions from other users */}
{!field.readonly && suggestions && suggestions.length > 0 && (
  <PaginatedSuggestionDropdown
    fieldId={field.id}
    fieldTitle={field.title}
    suggestions={suggestions}
    onSelect={handleSelectSuggestion}
    type="custom"
    hasMore={false} // Custom fields don't support pagination yet
    isLoadingMore={false}
    onLoadMore={() => {}} // No-op for custom fields
    totalLoaded={suggestions.length}
    maxSuggestions={100}
  />
)}
    </div>
  );
};

// Improved List Field Component
export const ListField: React.FC<CustomFieldProps> = ({ 
  field, 
  formMethods, 
  suggestions 
}) => {
  const { setValue, watch } = formMethods;
  const fieldId = `customFields.${field.id}`;
  
  // Determine if field is editable
  const isEditable = !field.readonly;
  
  // Determine if user can add new entries
  const canUserAdd = field.allowUserAdd && isEditable;
  
  // Initialize the form field with existing values
  useEffect(() => {
    const formValues = watch(fieldId);
    
    // If no form values but field has values, initialize with field values
    if ((!formValues || formValues.length === 0) && field.values && field.values.length > 0) {
      setValue(fieldId, [...field.values]);
    }
  }, [field.id, field.values, fieldId, setValue, watch]);
  
  // Get the current values from form state with fallback
  const formValues = watch(fieldId) || [];
  
  // Original values are those from the field definition
  const originalValues = field.values || [];
  
  // User-added values are any beyond the original values length
  const userValues = formValues.length > originalValues.length 
    ? formValues.slice(originalValues.length) 
    : [];
  
  // Check if we've reached the maximum number of entries
  const hasReachedMaxEntries = field.maxEntries > 0 && 
    formValues.length >= field.maxEntries;
  
  // Handle adding a new empty input
  const handleAddEmpty = () => {
    if (canUserAdd && !hasReachedMaxEntries) {
      setValue(fieldId, [...formValues, '']);
    }
  };
  
  // Handle updating a value
  const handleValueChange = (index: number, value: string) => {
    const newValues = [...formValues];
    newValues[index] = value;
    setValue(fieldId, newValues);
  };
  
  // Handle removing a value
  const handleRemoveValue = (index: number) => {
    // Only allow removing user-added values (those beyond original values)
    if (index >= originalValues.length) {
      const newValues = [...formValues];
      newValues.splice(index, 1);
      setValue(fieldId, newValues);
    }
  };
  
  // Handle selecting a suggestion from other users
  const handleSelectSuggestion = (suggestion: string) => {
    // Only add if we haven't reached max entries and user can add entries
    if (canUserAdd && !hasReachedMaxEntries) {
      // Check if suggestion already exists in the list
      const suggestionExists = formValues.some(value => 
        value.toLowerCase() === suggestion.toLowerCase()
      );
      
      if (!suggestionExists) {
        // Add the suggestion to the list
        setValue(fieldId, [...formValues, suggestion]);
      }
    }
  };
  
  return (
    <div className="bg-purple-800/30 rounded-lg p-4 mb-4">
      <Label className="text-purple-100 mb-3 block font-medium text-lg">
        {field.title}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      
      <div className="space-y-4">
        {/* Original values section */}
        {originalValues.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-purple-200 mb-2">Original Items</h4>
            <div className="space-y-2">
              {originalValues.map((value, index) => (
                <div key={`original-${index}`} className="flex items-center space-x-2">
                  {field.readonly ? (
                    <div className="p-2 bg-purple-800/40 rounded w-full">
                      <p className="text-purple-100">{value}</p>
                    </div>
                  ) : (
                    <Input
                      value={index < formValues.length ? formValues[index] : value}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      className="bg-purple-800/50 border-purple-600 text-purple-100"
                      placeholder={field.placeholder || `Enter ${field.title.toLowerCase()}`}
                      readOnly={field.readonly}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* User-added values section */}
        {userValues.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-purple-200 mb-2">Your Added Items</h4>
            <div className="space-y-2">
              {userValues.map((value, index) => {
                const actualIndex = originalValues.length + index;
                
                return (
                  <div key={`user-${index}`} className="flex items-center space-x-2">
                    <Input
                      value={value}
                      onChange={(e) => handleValueChange(actualIndex, e.target.value)}
                      className="bg-purple-800/50 border-purple-600 text-purple-100"
                      placeholder={field.placeholder || `Enter ${field.title.toLowerCase()}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveValue(actualIndex)}
                      className="text-red-300 hover:text-red-200 hover:bg-red-800/30"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Add button */}
        {canUserAdd && !hasReachedMaxEntries && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddEmpty}
            className="text-purple-100 hover:text-white hover:bg-purple-800 w-full mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
        
        {/* Suggestions from other users */}
    {canUserAdd && suggestions && suggestions.length > 0 && !hasReachedMaxEntries && (
          <PaginatedSuggestionDropdown
            fieldId={field.id}
            fieldTitle={field.title}
            suggestions={suggestions}
            onSelect={handleSelectSuggestion}
            type="custom"
            hasMore={false} // Custom fields don't support pagination yet
            isLoadingMore={false}
            onLoadMore={() => {}} // No-op for custom fields
            totalLoaded={suggestions.length}
            maxSuggestions={100}
          />
        )}
        
        {/* Messages */}
        {hasReachedMaxEntries && (
          <p className="text-amber-400 text-sm mt-1">
            Maximum entries reached ({field.maxEntries})
          </p>
        )}
        
        {field.required && formValues.length === 0 && (
          <p className="text-red-400 text-sm mt-1">
            At least one entry is required
          </p>
        )}
        
        {field.readonly && formValues.length === 0 && (
          <p className="text-purple-300 italic">No values specified</p>
        )}
      </div>
    </div>
  );
};

// Custom Field Renderer
const CustomFieldRenderer: React.FC<CustomFieldProps> = (props) => {
  const { field } = props;
  
  switch (field.type) {
    case 'text':
      return <TextField {...props} />;
    case 'radio':
      return <RadioField {...props} />;
    case 'checkbox':
      return <CheckboxField {...props} />;
    case 'list':
      return <ListField {...props} />;
    default:
      return (
        <div className="bg-purple-800/30 rounded-lg p-4 mb-4 text-red-300">
          Unknown field type: {field.type}
        </div>
      );
  }
};

export default CustomFieldRenderer;