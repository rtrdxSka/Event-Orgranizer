import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MultiDateField from "@/components/MultiDateField";
import { EventFormData } from "@/types";
import MultiPlaceField from "./MultiPlaceField";

interface EventFormFieldsProps {
  formData: EventFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleDateChange: (dates: string[]) => void;
  handleAllowUserAddChange: (
    fieldName: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMaxValuesChange: (
    fieldName: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePlaceChange: (places: string[]) => void;
}

const EventFormFields = ({
  formData,
  handleInputChange,
  handleDateChange,
  handleAllowUserAddChange,
  handleMaxValuesChange,
  handlePlaceChange,
}: EventFormFieldsProps) => {
  return (
    <div className="space-y-6 mb-8">
      <div>
        <label className="block text-purple-100 mb-2">Event Name *</label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="bg-purple-800/50 border-purple-600 text-purple-100"
          placeholder="Enter event name"
          required
        />
      </div>

      <div>
        <label className="block text-purple-100 mb-2">Description *</label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="bg-purple-800/50 border-purple-600 text-purple-100"
          placeholder="Describe your event"
          rows={4}
          required
        />
      </div>

            <div>
        <label className="block text-purple-100 mb-2">Event Closes By</label>
        <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
          <Input
            name="closesBy"
            type="datetime-local"
            value={formData.closesBy}
            onChange={handleInputChange}
            className="bg-purple-800/50 border-purple-600 text-purple-100"
            placeholder="Select closing date and time"
          />
          <p className="text-purple-400 text-sm mt-2">
            Set a date when voting for this event will close. If not set, the event will remain open indefinitely.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-purple-100">Event Dates *</label>
          <div className="flex items-center gap-2">
            <label className="text-purple-100 text-sm">Max Dates:</label>
            <Input
              type="number"
              min="0"
              value={formData.eventDates.maxDates}
              onChange={handleMaxValuesChange("eventDates")}
              className="bg-purple-800/50 border-purple-600 text-purple-100 w-24 h-8 text-sm"
              placeholder="0 for unlimited"
            />
            <label className="text-purple-100 text-sm ml-2">Max Votes:</label>
            <Input
              type="number"
              min="1"
              name="maxVotes" // Add name attribute
              value={formData.eventDates.maxVotes}
              onChange={handleMaxValuesChange("eventDates")}
              className="bg-purple-800/50 border-purple-600 text-purple-100 w-24 h-8 text-sm"
              placeholder="1"
            />
          </div>
        </div>

        <MultiDateField
          dates={formData.eventDates.dates}
          maxDates={formData.eventDates.maxDates}
          onChange={handleDateChange}
        />

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="allowUserAddDates"
            checked={formData.eventDates.allowUserAdd}
            onChange={handleAllowUserAddChange("eventDates")}
            className="rounded border-purple-600 bg-purple-800/50 text-purple-600 focus:ring-purple-500"
          />
          <label htmlFor="allowUserAddDates" className="text-purple-200">
            Allow users to add dates
          </label>
        </div>

        <p className="text-purple-400 text-sm mt-1">
          {formData.eventDates.maxDates === 0
            ? formData.eventDates.allowUserAdd
              ? "Users can suggest unlimited dates"
              : "Fixed dates only (users cannot add dates)"
            : formData.eventDates.allowUserAdd
            ? `Users can suggest up to ${formData.eventDates.maxDates} dates`
            : `Fixed dates only (limit: ${formData.eventDates.maxDates})`}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-purple-100">Place</label>
          <div className="flex items-center gap-2">
            <label className="text-purple-100 text-sm">Max Places:</label>
            <Input
              type="number"
              min="0"
              value={formData.place.maxPlaces}
              onChange={handleMaxValuesChange("place")}
              className="bg-purple-800/50 border-purple-600 text-purple-100 w-24 h-8 text-sm"
              placeholder="0 for unlimited"
            />
            <label className="text-purple-100 text-sm ml-2">Max Votes:</label>
            <Input
              type="number"
              min="1"
              name="maxVotes"
              value={formData.place.maxVotes}
              onChange={handleMaxValuesChange("place")}
              className="bg-purple-800/50 border-purple-600 text-purple-100 w-24 h-8 text-sm"
              placeholder="1"
            />
          </div>
        </div>

        <MultiPlaceField
          places={formData.place.places}
          maxPlaces={formData.place.maxPlaces}
          onChange={handlePlaceChange}
        />

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="allowUserAddPlaces"
            checked={formData.place.allowUserAdd}
            onChange={handleAllowUserAddChange("place")}
            className="rounded border-purple-600 bg-purple-800/50 text-purple-600 focus:ring-purple-500"
          />
          <label htmlFor="allowUserAddPlaces" className="text-purple-200">
            Allow users to add places
          </label>
        </div>

        <p className="text-purple-400 text-sm mt-1">
          {formData.place.maxPlaces === 0
            ? formData.place.allowUserAdd
              ? "Users can suggest unlimited places"
              : "Fixed places only (users cannot add places)"
            : formData.place.allowUserAdd
            ? `Users can suggest up to ${formData.place.maxPlaces} places`
            : `Fixed places only (limit: ${formData.place.maxPlaces})`}
        </p>
      </div>
    </div>
  );
};

export default EventFormFields;
