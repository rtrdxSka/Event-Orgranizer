import React from 'react';
import { Button } from "@/components/ui/button";

// Define the types for our props to match the existing implementation
interface BaseField {
  id: number;
  type: 'text' | 'list' | 'radio' | 'checkbox';
  title: string;
  placeholder: string;
  value: string;
  required: boolean;
  readonly: boolean;
}

interface TextField extends BaseField {
  type: 'text';
}

interface RadioField extends BaseField {
  type: 'radio';
  options: Array<{
    id: number;
    label: string;
  }>;
  selectedOption: number | null;
}

interface CheckboxField extends BaseField {
  type: 'checkbox';
  options: Array<{
    id: number;
    label: string;
    checked: boolean;
  }>;
}

interface ListField extends BaseField {
  type: 'list';
  values: string[];
  maxEntries: number;
  allowUserAdd: boolean;
}

type Field = TextField | ListField | RadioField | CheckboxField;
type FieldSettings = Partial<Omit<Field, 'id' | 'type'>>;

interface FieldOptionsProps {
  field: Field;
  onUpdate: (settings: FieldSettings) => void;
}

const FieldOptions: React.FC<FieldOptionsProps> = ({ field, onUpdate }) => {
  const handleOptionClick = (option: 'required' | 'readonly' | 'optional') => {
    // Special handling for radio and checkbox fields
    if (field.type === 'radio' || field.type === 'checkbox') {
      onUpdate({
        required: option === 'required',
        readonly: false // Always false for radio and checkbox
      });
      return;
    }

    // Original logic for other field types
    if (
      (option === 'required' && field.required) ||
      (option === 'readonly' && field.readonly) ||
      (option === 'optional' && (!field.required && !field.readonly))
    ) {
      onUpdate({
        required: false,
        readonly: false
      });
      return;
    }
    onUpdate({
      required: option === 'required',
      readonly: option === 'readonly'
    });
  };

  const isOptional = !field.required && !field.readonly;

  // For radio and checkbox fields, only show required toggle
  if (field.type === 'radio' || field.type === 'checkbox') {
    return (
      <div className="space-y-3">
        <label className="block text-purple-200 text-sm font-medium">Field Type</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`px-3 py-1 h-8 rounded-md w-full ${
              field.required
                ? "bg-purple-600 text-purple-50"
                : "bg-purple-800/50 text-purple-200 hover:bg-purple-700/50"
            }`}
            onClick={() => handleOptionClick(field.required ? 'optional' : 'required')}
          >
            {field.required ? 'Required' : 'Optional'}
          </Button>
        </div>
        <p className="text-purple-300 text-xs">
          {field.required 
            ? "Users must select an option." 
            : "Users can skip this field."}
        </p>
      </div>
    );
  }

  // Original render for other field types
  return (
    <div className="space-y-3">
      <label className="block text-purple-200 text-sm font-medium">Field Type</label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`px-3 py-1 h-8 rounded-md ${
            field.required
              ? "bg-purple-600 text-purple-50"
              : "bg-purple-800/50 text-purple-200 hover:bg-purple-700/50"
          }`}
          onClick={() => handleOptionClick('required')}
        >
          Required
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`px-3 py-1 h-8 rounded-md ${
            field.readonly
              ? "bg-purple-600 text-purple-50"
              : "bg-purple-800/50 text-purple-200 hover:bg-purple-700/50"
          }`}
          onClick={() => handleOptionClick('readonly')}
        >
          Read-only
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`px-3 py-1 h-8 rounded-md ${
            isOptional
              ? "bg-purple-600 text-purple-50"
              : "bg-purple-800/50 text-purple-200 hover:bg-purple-700/50"
          }`}
          onClick={() => handleOptionClick('optional')}
        >
          Optional
        </Button>
      </div>
      <p className="text-purple-300 text-xs">
        {isOptional && "Users can choose whether to fill out this field."}
        {field.required && "Users must fill out this field."}
        {field.readonly && "Users cannot modify this field."}
      </p>
    </div>
  );
};

export default FieldOptions;