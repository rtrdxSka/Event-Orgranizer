import React from 'react';
import { Button } from "@/components/ui/button";

const FieldOptions = ({ field, onUpdate }) => {
  const handleOptionClick = (option) => {
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