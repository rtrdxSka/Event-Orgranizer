import React from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
        render={({ field: formField }) => (
          <Input
            id={fieldId}
            {...formField}
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

// List Field Component
export const ListField: React.FC<CustomFieldProps> = ({ 
  field
}) => {
  return (
    <div className="bg-purple-800/30 rounded-lg p-4 mb-4">
      <Label className="text-purple-100 mb-3 block font-medium text-lg">
        {field.title}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      
      {/* Display values as a list */}
      <div className="space-y-2">
        {(field.values || []).length > 0 ? (
          (field.values || []).map((value, index) => (
            <div key={index} className="p-2 bg-purple-800/40 rounded">
              <p className="text-purple-100">{value}</p>
            </div>
          ))
        ) : (
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
      return <div className="bg-purple-800/30 rounded-lg p-4 mb-4 text-red-300">
        Unknown field type: {field.type}
      </div>;
  }
};

export default CustomFieldRenderer;