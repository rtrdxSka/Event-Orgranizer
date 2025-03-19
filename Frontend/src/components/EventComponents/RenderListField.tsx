import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { ListField, FieldSettings } from "@/types";

interface RenderListFieldProps {
  field: ListField;
  updateFieldSettings: (id: number, settings: FieldSettings) => void;
}

const RenderListField = ({
  field,
  updateFieldSettings,
}: RenderListFieldProps) => {
  return (
    <div className="space-y-2 mt-2">
      {field.values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => {
              const newValues = [...field.values];
              newValues[index] = e.target.value;
              updateFieldSettings(field.id, {
                values: newValues,
              });
            }}
            className="bg-purple-800/50 border-purple-600 text-purple-100"
            placeholder={field.placeholder}
          />
          {field.values.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const newValues = field.values.filter((_, i) => i !== index);
                updateFieldSettings(field.id, {
                  values: newValues,
                });
              }}
              className="text-purple-100 hover:text-white hover:bg-purple-800"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      
      {(!field.maxEntries || field.values.length < field.maxEntries) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const newValues = [...field.values, ""];
            updateFieldSettings(field.id, {
              values: newValues,
            });
          }}
          className="text-purple-100 hover:text-white hover:bg-purple-800 w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      )}
    </div>
  );
};

export default RenderListField;