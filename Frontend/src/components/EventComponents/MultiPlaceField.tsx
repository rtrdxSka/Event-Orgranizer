import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, MapPin } from "lucide-react";

interface MultiPlaceFieldProps {
  places: string[];
  maxPlaces: number;
  onChange: (places: string[]) => void;
}

const MultiPlaceField: React.FC<MultiPlaceFieldProps> = ({
  places,
  maxPlaces,
  onChange,
}) => {
  const handlePlaceChange = (index: number, value: string) => {
    const newPlaces = [...places];
    newPlaces[index] = value;
    onChange(newPlaces);
  };

  const addPlace = () => {
    // Only add a new place if we're below the max or if max is 0 (unlimited)
    if (maxPlaces === 0 || places.length < maxPlaces) {
      onChange([...places, ""]);
    }
  };

  const removePlace = (index: number) => {
    // Ensure we always have at least one place field
    if (places.length > 1) {
      const newPlaces = [...places];
      newPlaces.splice(index, 1);
      onChange(newPlaces);
    } else {
      // If it's the last place, just clear it
      onChange([""]);
    }
  };

  const showAddButton = maxPlaces === 0 || places.length < maxPlaces;

  return (
    <div className="space-y-2">
      {places.map((place, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Input
              value={place}
              onChange={(e) => handlePlaceChange(index, e.target.value)}
              className="bg-purple-800/50 border-purple-600 text-purple-100 pr-10"
              placeholder="Enter a location"
            />
            <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-purple-400" />
          </div>
          {places.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removePlace(index)}
              className="text-purple-100 hover:text-white hover:bg-purple-800"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      
      {showAddButton && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addPlace}
          className="text-purple-100 hover:text-white hover:bg-purple-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Place
        </Button>
      )}
    </div>
  );
};

export default MultiPlaceField;