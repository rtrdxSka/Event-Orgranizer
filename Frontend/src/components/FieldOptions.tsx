import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  maxOptions: number;
  allowUserAddOptions: boolean;
}

interface CheckboxField extends BaseField {
  type: 'checkbox';
  options: Array<{
    id: number;
    label: string;
    checked: boolean;
  }>;
  maxOptions: number;
  allowUserAddOptions: boolean;
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
    // Handle for all field types
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
    <div className="space-y-4">
      {/* Common settings for all field types */}
      <div>
        <label className="block text-purple-100 mb-2">
          Placeholder Text
        </label>
        <Input
          value={field.placeholder}
          onChange={(e) =>
            onUpdate({
              placeholder: e.target.value,
            })
          }
          className="bg-purple-800/50 border-purple-600 text-purple-100"
          placeholder="Enter placeholder text"
        />
      </div>

      {/* Field type settings */}
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
          {field.type !== 'radio' && field.type !== 'checkbox' && (
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
          )}
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

      {/* List field specific settings */}
      {field.type === 'list' && (
        <>
          <div>
            <label className="block text-purple-100 mb-2">
              Maximum Entries
            </label>
            <Input
              type="number"
              min="0"
              value={(field as ListField).maxEntries}
              onChange={(e) =>
                onUpdate({
                  maxEntries: parseInt(e.target.value) || 0,
                })
              }
              className="bg-purple-800/50 border-purple-600 text-purple-100"
              placeholder="0 for unlimited"
            />
            <p className="text-purple-400 text-sm mt-1">
              Set to 0 for unlimited entries.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`allowUserAdd-${field.id}`}
                checked={(field as ListField).allowUserAdd}
                onChange={(e) =>
                  onUpdate({
                    allowUserAdd: e.target.checked,
                  })
                }
                className="rounded border-purple-600 bg-purple-800/50 text-purple-600 focus:ring-purple-500"
              />
              <label
                htmlFor={`allowUserAdd-${field.id}`}
                className="text-purple-200"
              >
                Allow users to add entries
              </label>
            </div>
          </div>
        </>
      )}

      {/* Radio field specific settings */}
      {field.type === 'radio' && (
        <>
          <div>
            <label className="block text-purple-100 mb-2">
              Maximum Options
            </label>
            <Input
              type="number"
              min="0"
              value={(field as RadioField).maxOptions}
              onChange={(e) =>
                onUpdate({
                  maxOptions: parseInt(e.target.value) || 0,
                })
              }
              className="bg-purple-800/50 border-purple-600 text-purple-100"
              placeholder="0 for unlimited"
            />
            <p className="text-purple-400 text-sm mt-1">
              Set to 0 for unlimited options.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`allowUserAddOptions-${field.id}`}
                checked={(field as RadioField).allowUserAddOptions}
                onChange={(e) =>
                  onUpdate({
                    allowUserAddOptions: e.target.checked,
                  })
                }
                className="rounded border-purple-600 bg-purple-800/50 text-purple-600 focus:ring-purple-500"
              />
              <label
                htmlFor={`allowUserAddOptions-${field.id}`}
                className="text-purple-200"
              >
                Allow users to add options
              </label>
            </div>
            <p className="text-purple-400 text-xs mt-1">
              If enabled, users can add their own options to this field.
            </p>
          </div>
        </>
      )}

      {/* Checkbox field specific settings */}
      {field.type === 'checkbox' && (
        <>
          <div>
            <label className="block text-purple-100 mb-2">
              Maximum Options
            </label>
            <Input
              type="number"
              min="0"
              value={(field as CheckboxField).maxOptions}
              onChange={(e) =>
                onUpdate({
                  maxOptions: parseInt(e.target.value) || 0,
                })
              }
              className="bg-purple-800/50 border-purple-600 text-purple-100"
              placeholder="0 for unlimited"
            />
            <p className="text-purple-400 text-sm mt-1">
              Set to 0 for unlimited options.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`allowUserAddOptions-${field.id}`}
                checked={(field as CheckboxField).allowUserAddOptions}
                onChange={(e) =>
                  onUpdate({
                    allowUserAddOptions: e.target.checked,
                  })
                }
                className="rounded border-purple-600 bg-purple-800/50 text-purple-600 focus:ring-purple-500"
              />
              <label
                htmlFor={`allowUserAddOptions-${field.id}`}
                className="text-purple-200"
              >
                Allow users to add options
              </label>
            </div>
            <p className="text-purple-400 text-xs mt-1">
              If enabled, users can add their own options to this field.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default FieldOptions;