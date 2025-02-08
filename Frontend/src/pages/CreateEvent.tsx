import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useMutation } from '@tanstack/react-query';
import { createEvent } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateEventInput, createEventValidationSchema } from '@/lib/validations/event.schemas';

interface CustomField {
  key: string;
  type: 'single' | 'multiple';
  value: string;
  values: string[];  // Used when type is 'multiple'
}

const CreateEvent = () => {
  const navigate = useNavigate();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventValidationSchema)
  });

  const { mutate: submitEvent } = useMutation({
    mutationFn: createEvent,
    onSuccess: (response) => {
      if (response?.data?.event?._id) {
        navigate(`/event/${response.data.event._id}`);
      } else {
        console.log('Missing event ID in response:', response);
        navigate('/events');
      }
    },
    onError: (err: any) => {
      if (err.status === 400) {
        setError(err.message || 'Invalid form data');
      } else {
        setError(err.message || 'Failed to create event');
      }
    }
  });

  const addCustomField = () => {
    setCustomFields([...customFields, { 
      key: '', 
      type: 'single', 
      value: '',
      values: [''] // Initialize with one empty input
    }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: keyof CustomField, value: string | 'single' | 'multiple') => {
    const newFields = [...customFields];
    if (field === 'type') {
      newFields[index] = {
        ...newFields[index],
        type: value as 'single' | 'multiple',
        values: value === 'multiple' ? [''] : [] // Reset with one empty input for multiple
      };
    } else {
      newFields[index][field] = value;
    }
    setCustomFields(newFields);
  };

  const addValueField = (fieldIndex: number) => {
    const newFields = [...customFields];
    newFields[fieldIndex].values.push('');
    setCustomFields(newFields);
  };

  const updateValueField = (fieldIndex: number, valueIndex: number, value: string) => {
    const newFields = [...customFields];
    newFields[fieldIndex].values[valueIndex] = value;
    setCustomFields(newFields);
  };

  const removeValueField = (fieldIndex: number, valueIndex: number) => {
    const newFields = [...customFields];
    newFields[fieldIndex].values = newFields[fieldIndex].values.filter((_, i) => i !== valueIndex);
    setCustomFields(newFields);
  };

  const onSubmit = (data: CreateEventInput) => {
    const customFieldsObject = customFields.reduce((acc, field) => {
      if (field.key) {
        acc[field.key] = field.type === 'multiple' 
          ? field.values.filter(v => v.trim() !== '')
          : field.value;
      }
      return acc;
    }, {} as Record<string, string | string[]>);

    submitEvent({
      ...data,
      eventDate: data.eventDate || undefined, // Handle empty string case
      customFields: Object.keys(customFieldsObject).length > 0 ? customFieldsObject : undefined
    });
  };

  return (
    <div className="min-h-screen bg-purple-950">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto bg-purple-900/40 rounded-xl p-8 border border-purple-700/50">
          <h1 className="text-4xl font-bold text-purple-100 mb-8">Create New Event</h1>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-purple-100 mb-2">Event Name *</label>
              <Input
                {...register('name')}
                className="bg-purple-800/50 border-purple-600 text-purple-100"
                placeholder="Enter event name"
              />
              {errors.name && (
                <p className="mt-1 text-red-400 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-purple-100 mb-2">Description *</label>
              <Textarea
                {...register('description')}
                className="bg-purple-800/50 border-purple-600 text-purple-100"
                placeholder="Describe your event"
                rows={4}
              />
              {errors.description && (
                <p className="mt-1 text-red-400 text-sm">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-purple-100 mb-2">Date</label>
              <div className="relative group cursor-pointer">
                <Input
                  type="datetime-local"
                  {...register('eventDate')}
                  className="bg-purple-800/50 border-purple-600 text-purple-100 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  onClick={(e) => {
                    const input = e.currentTarget;
                    input.showPicker();
                  }}
                />
                <Calendar 
                  className="absolute right-3 top-2.5 h-5 w-5 text-purple-400 pointer-events-none group-hover:text-purple-200 transition-colors" 
                />
              </div>
              {errors.eventDate && (
                <p className="mt-1 text-red-400 text-sm">{errors.eventDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-purple-100 mb-2">Place</label>
              <div className="relative">
                <Input
                  {...register('place')}
                  className="bg-purple-800/50 border-purple-600 text-purple-100"
                  placeholder="Enter location"
                />
                <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-purple-400" />
              </div>
              {errors.place && (
                <p className="mt-1 text-red-400 text-sm">{errors.place.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-purple-100">Custom Fields</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addCustomField}
                  className="text-purple-100 hover:text-white hover:bg-purple-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>

              {customFields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="space-y-3 bg-purple-800/20 p-4 rounded-lg">
                  <div className="flex gap-4">
                    <Input
                      value={field.key}
                      onChange={(e) => updateCustomField(fieldIndex, 'key', e.target.value)}
                      className="bg-purple-800/50 border-purple-600 text-purple-100"
                      placeholder="Field name"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateCustomField(fieldIndex, 'type', e.target.value as 'single' | 'multiple')}
                      className="bg-purple-800/50 border-purple-600 text-purple-100 rounded-md px-3"
                    >
                      <option value="single">Single Value</option>
                      <option value="multiple">Multiple Values</option>
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomField(fieldIndex)}
                      className="text-purple-100 hover:text-white hover:bg-purple-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {field.type === 'single' ? (
                    <Input
                      value={field.value}
                      onChange={(e) => updateCustomField(fieldIndex, 'value', e.target.value)}
                      className="bg-purple-800/50 border-purple-600 text-purple-100"
                      placeholder="Field value"
                    />
                  ) : (
                    <div className="space-y-2">
                      {field.values.map((value, valueIndex) => (
                        <div key={valueIndex} className="flex gap-2">
                          <Input
                            value={value}
                            onChange={(e) => updateValueField(fieldIndex, valueIndex, e.target.value)}
                            className="bg-purple-800/50 border-purple-600 text-purple-100"
                            placeholder={`Value ${valueIndex + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeValueField(fieldIndex, valueIndex)}
                            disabled={field.values.length === 1}
                            className="text-purple-100 hover:text-white hover:bg-purple-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addValueField(fieldIndex)}
                        className="text-purple-100 hover:text-white hover:bg-purple-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Value
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-purple-200 text-purple-950 hover:bg-purple-100"
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;