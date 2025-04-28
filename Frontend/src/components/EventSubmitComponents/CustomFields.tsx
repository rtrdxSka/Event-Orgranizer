import React, { useEffect, useState } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

// Text Field Component
export const TextField: React.FC<CustomFieldProps> = ({ 
  field, 
  formMethods 
}) => {
  const { control } = formMethods;
  const fieldId = `customFields.${field.id}`;
  
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
    </div>
  );
};

// Radio Field Component
export const RadioField: React.FC<CustomFieldProps> = ({ 
  field, 
  formMethods
}) => {
  const { control, setValue, watch } = formMethods;
  const fieldId = `customFields.${field.id}`;
  const [newOption, setNewOption] = useState('');
  
  // Track user-added options separately
  const [userAddedOptions, setUserAddedOptions] = useState<Array<{id: number, label: string}>>([]);
  const allOptions = [...(field.options || []), ...userAddedOptions];
  const hasReachedMaxOptions = field.maxOptions && allOptions.length >= field.maxOptions;

  // Initialize the form field with a structure that can track both selection and user-added options
  useEffect(() => {
    // Get current value
    const currentValue = watch(fieldId);
    
    // If no value is set yet, initialize with an object structure
    if (!currentValue) {
      setValue(fieldId, {
        value: '', // Selected option value
        userAddedOptions: [] // Array to track all user-added options
      });
    } else if (typeof currentValue === 'string') {
      // If current value is just a string, convert to our new structure
      setValue(fieldId, {
        value: currentValue,
        userAddedOptions: []
      });
    }
  }, [fieldId, setValue, watch]);

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
      const formValue = watch(fieldId) || { value: '', userAddedOptions: [] };
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
      const formValue = watch(fieldId) || { value: '', userAddedOptions: [] };
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
    const formValue = watch(fieldId) || { value: '', userAddedOptions: [] };
    setValue(fieldId, {
      ...formValue,
      value
    });
  };
  
  // Get the currently selected value from the form
  const selectedValue = watch(`${fieldId}.value`) || '';
  
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
              checked={selectedValue === option.label}
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
                checked={selectedValue === option.label}
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
    </div>
  );
};

// Checkbox Field Component
export const CheckboxField: React.FC<CustomFieldProps> = ({ 
  field, 
  formMethods
}) => {
  const { control, setValue, watch } = formMethods;
  const fieldId = `customFields.${field.id}`;
  const [newOption, setNewOption] = useState('');

  // Track user-added options in local state
  const [userAddedOptions, setUserAddedOptions] = useState<Array<{id: string, label: string}>>([]);

  // Initialize the form data structure when component mounts
  useEffect(() => {
    // Create the structure to track both checked options and all user-added options
    // We'll store the form data as an object with:
    // 1. User-added options list
    // 2. A property for each option (original or user-added) with boolean values
    
    const initialFormData = {
      userAddedOptions: [] // This array tracks all user-added options
    };
    
    // Add initial checked state for original options
    field.options?.forEach(option => {
      initialFormData[option.id.toString()] = option.checked || false;
    });
    
    setValue(fieldId, initialFormData);
  }, [fieldId, field.options, setValue]);

  // Get current form value
  const formValue = watch(fieldId) || { userAddedOptions: [] };
  
  // Calculate if we've reached max options
  const allOptions = [
    ...(field.options || []),
    ...userAddedOptions
  ];
  const hasReachedMaxOptions = field.maxOptions && allOptions.length >= field.maxOptions;

  // Handle adding a new option
  const handleAddOption = () => {
    if (!newOption.trim() || !field.allowUserAddOptions || hasReachedMaxOptions) return;
    
    // Check if option already exists (in either original or user-added)
    const optionLabelExists = allOptions.some(opt => 
      opt.label.toLowerCase() === newOption.trim().toLowerCase()
    );
    
    if (optionLabelExists) {
      alert('This option already exists');
      return;
    }
    
    // Generate a unique ID for the new option
    const newId = `user_${Date.now()}`;
    const newUserOption = { id: newId, label: newOption.trim() };
    
    // Update local state
    setUserAddedOptions([...userAddedOptions, newUserOption]);
    
    // Update form data - add to userAddedOptions array and set initial checked state to false
    const updatedFormValue = { 
      ...formValue,
      userAddedOptions: [...(formValue.userAddedOptions || []), newOption.trim()]
    };
    updatedFormValue[newId] = false; // Initialize as unchecked
    
    setValue(fieldId, updatedFormValue);
    setNewOption('');
  };
  
  // Handle removing a user-added option
  const handleRemoveOption = (option: {id: string, label: string}) => {
    // Update local state
    setUserAddedOptions(userAddedOptions.filter(opt => opt.id !== option.id));
    
    // Update form data
    const updatedFormValue = { ...formValue };
    
    // Remove from userAddedOptions array
    updatedFormValue.userAddedOptions = (formValue.userAddedOptions || [])
      .filter(label => label !== option.label);
    
    // Remove the option's checked property
    delete updatedFormValue[option.id];
    
    setValue(fieldId, updatedFormValue);
  };
  
  // Handle checkbox change for any option
  const handleCheckboxChange = (optionId: string, checked: boolean) => {
    setValue(`${fieldId}.${optionId}`, checked);
  };
  
  // Check if the field has any selected options for validation
  const hasSelectedOptions = () => {
    if (!formValue) return false;
    
    return Object.entries(formValue).some(([key, value]) => {
      return key !== 'userAddedOptions' && value === true;
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
            <Controller
              name={`${fieldId}.${option.id}`}
              control={control}
              defaultValue={option.checked || false}
              render={({ field: formField }) => (
                <Checkbox
                  id={`${fieldId}-${option.id}`}
                  checked={formField.value}
                  onCheckedChange={formField.onChange}
                  className="text-purple-600 border-purple-400 bg-purple-800/50"
                />
              )}
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
              <Controller
                name={`${fieldId}.${option.id}`}
                control={control}
                defaultValue={false}
                render={({ field: formField }) => (
                  <Checkbox
                    id={`${fieldId}-${option.id}`}
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                    className="text-purple-600 border-purple-400 bg-purple-800/50"
                  />
                )}
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
      
      {/* Field validation message */}
      {field.required && !hasSelectedOptions() && (
        <p className="text-red-400 text-sm mt-2">
          At least one option must be selected
        </p>
      )}
    </div>
  );
};

// List Field Component - Fixed to handle empty values arrays
export const ListField: React.FC<CustomFieldProps> = ({ 
  field,
  formMethods
}) => {
  const { control, setValue, watch } = formMethods;
  const fieldId = `customFields.${field.id}`;
  
  // Determine if field is editable
  const isEditable = !field.readonly;
  
  // Determine if user can add new entries
  const canUserAdd = field.allowUserAdd && isEditable;
  
  // Track if we've initialized the form field
  const [initialized, setInitialized] = useState(false);
  
  // Initialize the form field with existing values or empty array
  useEffect(() => {
    if (!initialized) {
      // Start with an empty array if field.values is undefined or empty
      const initialValues = (field.values && field.values.length > 0) 
        ? [...field.values] 
        : [];
      
      setValue(fieldId, initialValues);
      setInitialized(true);
    }
  }, [field.id, field.values, fieldId, initialized, setValue]);
  
  // Get the current values from form state
  const formValues = watch(fieldId) || [];
  
  // Determine which values are original (from server) and which are user-added
  const originalValues = (field.values || []);
  // User values are all values if original values were empty, or the additional values if originals existed
  const userValues = originalValues.length === 0 
    ? formValues 
    : formValues.slice(originalValues.length);
  
  // Check if we've reached the maximum number of entries
  const hasReachedMaxEntries = field.maxEntries && 
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
    const newValues = [...formValues];
    newValues.splice(index, 1);
    setValue(fieldId, newValues);
  };
  
  return (
    <div className="bg-purple-800/30 rounded-lg p-4 mb-4">
      <Label className="text-purple-100 mb-3 block font-medium text-lg">
        {field.title}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      
      <div className="space-y-2">
        {/* Display existing values from the server - non-editable */}
        {originalValues.length > 0 && originalValues.map((value, index) => (
          <div key={`original-${index}`} className="flex items-center space-x-2">
            <div className="p-2 bg-purple-800/40 rounded w-full">
              <p className="text-purple-100">{value}</p>
            </div>
          </div>
        ))}
        
        {/* Display user-added values - editable */}
        {userValues.map((value, index) => {
          // Calculate the actual index in the formValues array
          const actualIndex = originalValues.length > 0 
            ? originalValues.length + index 
            : index;
            
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
                className="text-purple-100 hover:text-white hover:bg-purple-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        
        {/* Add button if user can add more and hasn't reached max entries */}
        {canUserAdd && !hasReachedMaxEntries && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddEmpty}
            className="text-purple-100 hover:text-white hover:bg-purple-800 w-full mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        )}
        
        {/* Show message if max entries reached */}
        {hasReachedMaxEntries && (
          <p className="text-amber-400 text-sm mt-1">
            Maximum entries reached ({field.maxEntries})
          </p>
        )}
        
        {/* Show message if the field is required but empty */}
        {field.required && formValues.length === 0 && (
          <p className="text-red-400 text-sm mt-1">
            At least one entry is required
          </p>
        )}
        
        {/* If readonly and no values, show a message */}
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