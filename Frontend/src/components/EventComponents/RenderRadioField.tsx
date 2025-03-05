import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { RadioField, FieldSettings } from "@/types";

interface RenderRadioFieldProps {
  field: RadioField;
  updateFieldSettings: (id: number, settings: FieldSettings) => void;
}

const RenderRadioField = ({ field, updateFieldSettings }: RenderRadioFieldProps) => {
  const reachedMaxOptions =
    field.maxOptions > 0 && field.options.length >= field.maxOptions;

  return (
    <div className="space-y-2 mt-2">
      {field.options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <input
            type="radio"
            checked={field.selectedOption === option.id}
            onChange={() =>
              updateFieldSettings(field.id, {
                selectedOption: option.id,
              })
            }
            className="text-purple-600 border-purple-400 bg-purple-800/50 focus:ring-purple-500 focus:ring-offset-purple-900"
          />
          <Input
            value={option.label}
            onChange={(e) => {
              const newOptions = field.options.map((opt) =>
                opt.id === option.id
                  ? {
                      ...opt,
                      label: e.target.value,
                    }
                  : opt
              );
              updateFieldSettings(field.id, {
                options: newOptions,
              });
            }}
            className="bg-purple-800/50 border-purple-600 text-purple-100"
            placeholder="Option label"
          />
          {field.options.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const newOptions = field.options.filter(
                  (opt) => opt.id !== option.id
                );
                updateFieldSettings(field.id, { options: newOptions });
              }}
              className="text-purple-100 hover:text-white hover:bg-purple-800"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {/* Only show Add Option button if max options haven't been reached */}
      {!reachedMaxOptions && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const newOptions = [
              ...field.options,
              { id: Date.now(), label: "" },
            ];
            updateFieldSettings(field.id, {
              options: newOptions,
            });
          }}
          className="text-purple-100 hover:text-white hover:bg-purple-800 w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      )}

      {/* Display a message if max options are reached */}
      {reachedMaxOptions && (
        <p className="text-purple-400 text-xs mt-1 italic">
          Maximum number of options reached ({field.maxOptions})
        </p>
      )}
    </div>
  );
};

export default RenderRadioField;