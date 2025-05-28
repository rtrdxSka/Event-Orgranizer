// components/EventSubmitComponents/PaginatedSuggestionDropdown.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Users, Loader2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaginatedSuggestionDropdownProps {
  fieldId: string;
  fieldTitle: string;
  suggestions: string[];
  onSelect: (value: string) => void;
  type: 'date' | 'place' | 'custom';
  // Pagination props
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  totalLoaded: number;
  maxSuggestions: number;
}

const PaginatedSuggestionDropdown: React.FC<PaginatedSuggestionDropdownProps> = ({
  fieldId,
  fieldTitle,
  suggestions,
  onSelect,
  type,
  hasMore,
  isLoadingMore,
  onLoadMore,
  totalLoaded,
  maxSuggestions
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
    } catch (error) {
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

  // Get status text for pagination
  const getStatusText = () => {
    if (totalLoaded >= maxSuggestions) {
      return `Showing ${totalLoaded} suggestions (limit reached)`;
    }
    if (hasMore) {
      return `Showing ${totalLoaded} suggestions (more available)`;
    }
    return `${totalLoaded} suggestions`;
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
              <span>See other suggestions ({suggestions.length})</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 bg-purple-900 border-purple-700 text-purple-100 max-h-96 overflow-y-auto">
          <DropdownMenuLabel className="text-purple-200 flex items-center justify-between">
            <span>{getDropdownLabel()}</span>
            <span className="text-xs text-purple-400 font-normal">
              {getStatusText()}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-purple-700/50" />
          
          {/* Suggestion Items */}
          {suggestions.map((suggestion, index) => (
            <DropdownMenuItem 
              key={`${suggestion}-${index}`}
              className="cursor-pointer flex items-center justify-between hover:bg-purple-800"
              onClick={() => onSelect(suggestion)}
            >
              <span className="flex-1 truncate pr-2">{getDisplayLabel(suggestion)}</span>
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
          
          {/* Load More Button */}
          {hasMore && totalLoaded < maxSuggestions && (
            <>
              <DropdownMenuSeparator className="bg-purple-700/50" />
              <DropdownMenuItem 
                className="cursor-pointer justify-center hover:bg-purple-800"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLoadMore();
                }}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  <>
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Load more suggestions
                  </>
                )}
              </DropdownMenuItem>
            </>
          )}
          
          {/* Limit Reached Message */}
          {totalLoaded >= maxSuggestions && (
            <>
              <DropdownMenuSeparator className="bg-purple-700/50" />
              <div className="px-2 py-1 text-xs text-purple-400 text-center">
                Suggestion limit reached ({maxSuggestions})
              </div>
            </>
          )}
          
          {/* No More Data Message */}
          {!hasMore && totalLoaded > 0 && totalLoaded < maxSuggestions && (
            <>
              <DropdownMenuSeparator className="bg-purple-700/50" />
              <div className="px-2 py-1 text-xs text-purple-400 text-center">
                No more suggestions available
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PaginatedSuggestionDropdown;