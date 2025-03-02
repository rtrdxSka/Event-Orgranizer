import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, X } from 'lucide-react';

interface MultiDateFieldProps {
  dates: string[];
  maxDates: number;
  onChange: (dates: string[]) => void;
}

const MultiDateField: React.FC<MultiDateFieldProps> = ({ 
  dates, 
  maxDates, 
  onChange 
}) => {
  const handleDateChange = (index: number, value: string) => {
    const newDates = [...dates];
    newDates[index] = value;
    onChange(newDates);
  };

  const addDateField = () => {
    if (maxDates === 0 || dates.length < maxDates) {
      onChange([...dates, '']);
    }
  };

  const removeDateField = (index: number) => {
    const newDates = dates.filter((_, i) => i !== index);
    onChange(newDates);
  };

  return (
    <div className="space-y-4">
      {dates.map((date, index) => (
        <div key={index} className="relative group cursor-pointer flex gap-2">
          <Input
            type="datetime-local"
            value={date}
            onChange={(e) => handleDateChange(index, e.target.value)}
            className="bg-purple-800/50 border-purple-600 text-purple-100 cursor-pointer flex-1 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            onClick={(e) => {
              const input = e.currentTarget;
              input.showPicker();
            }}
          />
          <Calendar 
            className="absolute right-12 top-2.5 h-5 w-5 text-purple-400 pointer-events-none group-hover:text-purple-200 transition-colors" 
          />
          {dates.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeDateField(index)}
              className="text-purple-100 hover:text-white hover:bg-purple-800"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      
      {(maxDates === 0 || dates.length < maxDates) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addDateField}
          className="text-purple-100 hover:text-white hover:bg-purple-800 w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Date Option
        </Button>
      )}
    </div>
  );
};

export default MultiDateField;