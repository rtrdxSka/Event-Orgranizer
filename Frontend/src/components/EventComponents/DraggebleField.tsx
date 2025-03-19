import React from "react";
import { useDrag } from "react-dnd";
import { GripVertical } from "lucide-react";
import { DragItem, FieldType, FIELD_TYPES } from "@/types";

interface DraggableFieldProps {
  type: FieldType;
}

const DraggableField = ({ type }: DraggableFieldProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "field",
    item: { type } as DragItem,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-4 mb-2 bg-purple-800/30 rounded-lg border border-purple-600/50 cursor-move flex items-center gap-3 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <GripVertical className="h-5 w-5 text-purple-400" />
      <span className="text-purple-100">
        {type === FIELD_TYPES.TEXT
          ? "Text Field"
          : type === FIELD_TYPES.LIST
          ? "List Field"
          : type === FIELD_TYPES.CHECKBOX
          ? "Checkbox Field"
          : "Radio Field"}
      </span>
    </div>
  );
};

export default DraggableField;