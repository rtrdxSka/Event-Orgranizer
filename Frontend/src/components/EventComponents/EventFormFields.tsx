import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin } from "lucide-react";
import MultiDateField from "@/components/MultiDateField";
import { EventFormData } from "@/types";

interface EventFormFieldsProps {
  formData: EventFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleDateChange: (dates: string[]) => void;
  handleAllowUserAddChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMaxDatesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EventFormFields = ({
  formData,
  handleInputChange,
  handleDateChange,
  handleAllowUserAddChange,
  handleMaxDatesChange,
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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-purple-100">Event Dates *</label>
          <div className="flex items-center gap-2">
            <label className="text-purple-100 text-sm">Max Dates:</label>
            <Input
              type="number"
              min="0"
              value={formData.eventDates.maxDates}
              onChange={handleMaxDatesChange}
              className="bg-purple-800/50 border-purple-600 text-purple-100 w-24 h-8 text-sm"
              placeholder="0 for unlimited"
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
            onChange={handleAllowUserAddChange}
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
        <label className="block text-purple-100 mb-2">Place</label>
        <div className="relative">
          <Input
            name="place"
            value={formData.place}
            onChange={handleInputChange}
            className="bg-purple-800/50 border-purple-600 text-purple-100"
            placeholder="Enter location"
          />
          <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-purple-400" />
        </div>
      </div>
    </div>
  );
};

export default EventFormFields;