import React from "react";
import { useDrop } from "react-dnd";
import { DragItem, FieldType } from "@/types";

interface FormFieldDropZoneProps {
  onDrop: (type: FieldType) => void;
}

const FormFieldDropZone = ({ onDrop }: FormFieldDropZoneProps) => {
  const [{ isOver }, drop] = useDrop({
    accept: "field",
    drop: (item: DragItem) => onDrop(item.type),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`min-h-[200px] rounded-lg border-2 border-dashed ${
        isOver ? "border-purple-400 bg-purple-900/30" : "border-purple-600/50"
      } p-4 transition-colors`}
    >
      {isOver ? (
        <div className="text-purple-200 text-center">Drop field here</div>
      ) : (
        <div className="text-purple-400 text-center">Drag fields here</div>
      )}
    </div>
  );
};

export default FormFieldDropZone;