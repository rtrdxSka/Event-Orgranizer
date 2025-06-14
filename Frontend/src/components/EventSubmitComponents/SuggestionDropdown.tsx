import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SuggestionDropdownProps {
  fieldId: string;
  fieldTitle: string;
  suggestions: string[];
  onSelect: (value: string) => void;
  type: 'date' | 'place' | 'custom';
}

const SuggestionDropdown: React.FC<SuggestionDropdownProps> = ({
  fieldTitle,
  suggestions,
  onSelect,
  type
}) => {
  // Don't render anything if there are no suggestions
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      
      // Format the date part
      const dateFormatted = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Format the time part
      const timeFormatted = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return `${dateFormatted} at ${timeFormatted}`;
    } catch {
      return dateStr; // Return original if parsing fails
    }
  };
  
  // Get the appropriate label based on field type
  const getDropdownLabel = () => {
    switch (type) {
      case 'date':
        return 'Other suggested dates';
      case 'place':
        return 'Other suggested places';
      default:
        return `Other suggestions for ${fieldTitle}`;
    }
  };
  
  // Format the display label for each suggestion
  const getDisplayLabel = (suggestion: string) => {
    if (type === 'date') {
      return formatDate(suggestion);
    }
    return suggestion;
  };

  return (
    <div className="mt-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 text-purple-200 border-purple-500/50 bg-purple-800/30 hover:bg-purple-700/30 hover:text-purple-100 w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span>See other suggestions</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 bg-purple-900 border-purple-700 text-purple-100">
          <DropdownMenuLabel className="text-purple-200">
            {getDropdownLabel()}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-purple-700/50" />
          {suggestions.map((suggestion, index) => (
            <DropdownMenuItem 
              key={index}
              className="cursor-pointer flex items-center justify-between hover:bg-purple-800"
              onClick={() => onSelect(suggestion)}
            >
              <span className="flex-1">{getDisplayLabel(suggestion)}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-2 h-7 w-7 p-0 bg-purple-700 hover:bg-purple-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(suggestion);
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SuggestionDropdown;