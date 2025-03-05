import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, X } from "lucide-react";
import FieldOptions from "@/components/FieldOptions";
import { 
  Field, 
  FieldSettings, 
  FIELD_TYPES, 
  TextField, 
  RadioField, 
  CheckboxField, 
  ListField 
} from "@/types";
import { 
  RenderTextField, 
  RenderRadioField, 
  RenderCheckboxField, 
  RenderListField 
} from "./RenderFields";

interface CustomFieldsListProps {
  formFields: Field[];
  selectedFieldId: number | null;
  setSelectedFieldId: (id: number | null) => void;
  updateFieldTitle: (id: number, title: string) => void;
  updateFieldValue: (id: number, value: string) => void;
  updateFieldSettings: (id: number, settings: FieldSettings) => void;
  setFormFields: React.Dispatch<React.SetStateAction<Field[]>>;
}

const CustomFieldsList = ({
  formFields,
  selectedFieldId,
  setSelectedFieldId,
  updateFieldTitle,
  updateFieldValue,
  updateFieldSettings,
  setFormFields,
}: CustomFieldsListProps) => {
  if (formFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg font-medium text-purple-100">Added Fields</h3>
      {formFields.map((field) => (
        <div key={field.id} className="bg-purple-800/20 p-4 rounded-lg">
          <div className="flex flex-col">
            {/* Title and control buttons */}
            <div className="flex items-center gap-2 mb-3">
              <Input
                value={field.title}
                onChange={(e) => updateFieldTitle(field.id, e.target.value)}
                className="bg-purple-800/50 border-purple-600 text-purple-100 font-medium"
                placeholder="Field title"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setSelectedFieldId(selectedFieldId === field.id ? null : field.id)
                }
                className={`text-purple-100 hover:text-white hover:bg-purple-800 ${
                  selectedFieldId === field.id ? "bg-purple-800" : ""
                }`}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFormFields(formFields.filter((f) => f.id !== field.id));
                  if (selectedFieldId === field.id) {
                    setSelectedFieldId(null);
                  }
                }}
                className="text-purple-100 hover:text-white hover:bg-purple-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Field content and settings */}
            <div className="flex gap-4">
              {/* Field content area */}
              <div className="flex-1 space-y-3">
                {/* Text field */}
                {field.type === FIELD_TYPES.TEXT && (
                  <RenderTextField 
                    field={field as TextField} 
                    updateFieldValue={updateFieldValue} 
                  />
                )}

                {/* Radio field */}
                {field.type === FIELD_TYPES.RADIO && (
                  <RenderRadioField 
                    field={field as RadioField} 
                    updateFieldSettings={updateFieldSettings} 
                  />
                )}

                {/* Checkbox field */}
                {field.type === FIELD_TYPES.CHECKBOX && (
                  <RenderCheckboxField 
                    field={field as CheckboxField} 
                    updateFieldSettings={updateFieldSettings} 
                  />
                )}

                {/* List field */}
                {field.type === FIELD_TYPES.LIST && (
                  <RenderListField 
                    field={field as ListField} 
                    updateFieldSettings={updateFieldSettings} 
                  />
                )}
              </div>

              {/* Settings panel */}
              {selectedFieldId === field.id && (
                <div className="w-72 bg-purple-900/60 rounded-lg p-4 border border-purple-700/50">
                  <h4 className="text-lg font-medium text-purple-100 mb-3">
                    Field Settings
                  </h4>
                  <FieldOptions
                    field={field}
                    onUpdate={(updates) =>
                      updateFieldSettings(field.id, updates)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomFieldsList;