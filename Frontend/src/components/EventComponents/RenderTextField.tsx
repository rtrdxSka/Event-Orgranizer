import React from "react";
import { Input } from "@/components/ui/input";
import { TextField } from "@/types";

interface RenderTextFieldProps {
  field: TextField;
  updateFieldValue: (id: number, value: string) => void;
}

const RenderTextField = ({ field, updateFieldValue }: RenderTextFieldProps) => {
  return (
    <Input
      value={field.value}
      onChange={(e) => updateFieldValue(field.id, e.target.value)}
      className="bg-purple-800/50 border-purple-600 text-purple-100"
      placeholder={field.placeholder}
    />
  );
};

export default RenderTextField;