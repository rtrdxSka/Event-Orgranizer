import React from 'react';
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
  const { control } = formMethods;
  const fieldId = `customFields.${field.id}`;
  
  return (
    <div className="bg-purple-800/30 rounded-lg p-4 mb-4">
      <Label className="text-purple-100 mb-3 block font-medium text-lg">
        {field.title}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      
      <Controller
        name={fieldId}
        control={control}
        defaultValue=""
        render={({ field: formField }) => (
          <RadioGroup
            value={formField.value}
            onValueChange={formField.onChange}
            className="space-y-2"
          >
            {(field.options || []).map((option) => (
              <div key={option.id} className="flex items-center space-x-2 p-2 bg-purple-800/40 rounded">
                <RadioGroupItem
                  id={`${fieldId}-${option.id}`}
                  value={option.label}
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
          </RadioGroup>
        )}
      />
    </div>
  );
};

// Checkbox Field Component
export const CheckboxField: React.FC<CustomFieldProps> = ({ 
  field, 
  formMethods
}) => {
  const { control } = formMethods;
  const fieldId = `customFields.${field.id}`;
  
  return (
    <div className="bg-purple-800/30 rounded-lg p-4 mb-4">
      <Label className="text-purple-100 mb-3 block font-medium text-lg">
        {field.title}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      
      <div className="space-y-2">
        {(field.options || []).map((option) => (
          <div key={option.id} className="flex items-center space-x-2 p-2 bg-purple-800/40 rounded">
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
      </div>
    </div>
  );
};

// List Field Component - Updated with improved logic
export const ListField: React.FC<CustomFieldProps> = ({ 
  field,
  formMethods
}) => {
  const { control, setValue, watch } = formMethods;
  const fieldId = `customFields.${field.id}`;
  
  // Determine if field is editable based on field properties
  // A field is editable if it's not readonly AND (it's required OR optional)
  const isEditable = !field.readonly;
  
  // Determine if user can add new entries
  // allowUserAdd is tied to whether the field is required/optional vs readonly
  const canUserAdd = field.allowUserAdd && isEditable;
  
  const [initialized, setInitialized] = React.useState(false);
  
  // Initialize the form field with existing values from the server
  React.useEffect(() => {
    // Only initialize once and when field values exist
    if (!initialized && field.values && field.values.length > 0) {
      setValue(fieldId, [...field.values]);
      setInitialized(true);
    }
  }, [field.id, field.values, fieldId, initialized, setValue]);
  
  // Get the current values from form state
  const formValues = watch(fieldId) || [];
  
  // Separate original values (from server) and user-added values
  const originalValues = field.values || [];
  const userValues = initialized ? formValues.slice(originalValues.length) : [];
  
  // Check if we've reached the maximum number of entries
  const hasReachedMaxEntries = field.maxEntries && 
    (originalValues.length + userValues.length) >= field.maxEntries;
  
  // Handle adding a new empty input
  const handleAddEmpty = () => {
    if (canUserAdd && !hasReachedMaxEntries) {
      // Get current form values or initialize with original values
      const currentValues = watch(fieldId) || [...originalValues];
      // Add an empty string to the end of the array
      setValue(fieldId, [...currentValues, '']);
    }
  };
  
  // Handle updating a value
  const handleValueChange = (index: number, value: string) => {
    const newValues = [...(watch(fieldId) || [...originalValues])];
    newValues[index] = value;
    setValue(fieldId, newValues);
  };
  
  // Handle removing a value
  const handleRemoveValue = (index: number) => {
    const newValues = [...(watch(fieldId) || [...originalValues])];
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
        {originalValues.map((value, index) => (
          <div key={`original-${index}`} className="flex items-center space-x-2">
            <div className="p-2 bg-purple-800/40 rounded w-full">
              <p className="text-purple-100">{value}</p>
            </div>
          </div>
        ))}
        
        {/* Display user-added values - editable */}
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
        
        {/* Show message if the field is required */}
        {field.required && originalValues.length === 0 && userValues.length === 0 && (
          <p className="text-red-400 text-sm mt-1">
            At least one entry is required
          </p>
        )}
        
        {/* If readonly and no values, show a message */}
        {field.readonly && originalValues.length === 0 && (
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