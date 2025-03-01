// Update your FieldOptions component to handle checkbox fields similarly to radio fields

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextField, ListField, RadioField, CheckboxField } from "@/types";

type Field = TextField | ListField | RadioField | CheckboxField;
type FieldSettings = Partial<Omit<Field, "id" | "type">>;

interface FieldOptionsProps {
  field: Field;
  onUpdate: (updates: FieldSettings) => void;
}

const FieldOptions: React.FC<FieldOptionsProps> = ({ field, onUpdate }) => {
  // Common settings for all field types
  const renderCommonSettings = () => (
    <div className="flex gap-4">
      <Button
        type="button"
        variant={field.required ? "secondary" : "ghost"}
        className={`flex-1 ${
          field.required 
            ? "bg-purple-200 text-purple-950 hover:bg-purple-100" 
            : "text-purple-100 hover:text-white hover:bg-purple-800"
        } ${field.readonly ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => {
          if (!field.readonly) {
            onUpdate({ required: !field.required });
          }
        }}
        disabled={field.readonly}
      >
        Required
      </Button>
      <Button
        type="button"
        variant={field.readonly ? "secondary" : "ghost"}
        className={`flex-1 ${
          field.readonly 
            ? "bg-purple-200 text-purple-950 hover:bg-purple-100" 
            : "text-purple-100 hover:text-white hover:bg-purple-800"
        } ${field.required ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => {
          if (!field.required) {
            onUpdate({ readonly: !field.readonly });
          }
        }}
        disabled={field.required}
      >
        Readonly
      </Button>
    </div>
  );

  // Text field specific settings
  const renderTextFieldSettings = () => (
    <div>
      <label className="block text-purple-100 mb-2">Placeholder Text</label>
      <Input
        value={field.placeholder}
        onChange={(e) => onUpdate({ placeholder: e.target.value })}
        className="bg-purple-800/50 border-purple-600 text-purple-100"
        placeholder="Enter placeholder text"
      />
    </div>
  );

  // List field specific settings
  const renderListFieldSettings = () => {
    const listField = field as ListField;
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-purple-100 mb-2">Placeholder Text</label>
          <Input
            value={field.placeholder}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            className="bg-purple-800/50 border-purple-600 text-purple-100"
            placeholder="Enter placeholder text"
          />
        </div>
        <div>
          <label className="block text-purple-100 mb-2">Maximum Entries</label>
          <Input
            type="number"
            min="0"
            value={listField.maxEntries}
            onChange={(e) => onUpdate({ maxEntries: parseInt(e.target.value) || 0 })}
            className="bg-purple-800/50 border-purple-600 text-purple-100"
            placeholder="0 for unlimited"
          />
          <p className="text-purple-400 text-sm mt-1">
            Set to 0 for unlimited entries
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowUserAdd"
              checked={listField.allowUserAdd}
              onChange={(e) => onUpdate({ allowUserAdd: e.target.checked })}
              className="rounded border-purple-600 bg-purple-800/50 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="allowUserAdd" className="text-purple-200">
              Allow users to add entries
            </label>
          </div>
        </div>
      </div>
    );
  };

  // Radio field specific settings
  const renderRadioFieldSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-purple-100 mb-2">Field Label</label>
        <Input
          value={field.placeholder}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          className="bg-purple-800/50 border-purple-600 text-purple-100"
          placeholder="Select an option"
        />
      </div>
      <div>
        <p className="text-purple-300 mb-2">Options Management</p>
        <div className="text-purple-200 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>Add/edit options in the main form</li>
            <li>At least 2 options are required</li>
            <li>For read-only fields, select a default option</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Checkbox field specific settings (now matching radio field format)
  const renderCheckboxFieldSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-purple-100 mb-2">Field Label</label>
        <Input
          value={field.placeholder}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          className="bg-purple-800/50 border-purple-600 text-purple-100"
          placeholder="Select options"
        />
      </div>
      <div>
        <p className="text-purple-300 mb-2">Checkbox Options Management</p>
        <div className="text-purple-200 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>Add/edit options in the main form</li>
            <li>At least 2 options are required</li>
            <li>Multiple options can be selected</li>
            <li>For read-only fields, pre-check default options</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderCommonSettings()}
      
      {field.type === 'text' && renderTextFieldSettings()}
      {field.type === 'list' && renderListFieldSettings()}
      {field.type === 'radio' && renderRadioFieldSettings()}
      {field.type === 'checkbox' && renderCheckboxFieldSettings()}
    </div>
  );
};

export default FieldOptions;