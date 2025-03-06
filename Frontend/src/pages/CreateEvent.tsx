import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Navbar from "@/components/NavBar";
import { eventFormSchema, validateForm } from "@/lib/validations/event.schemas";
import { 
  Field, 
  FieldSettings, 
  FieldType, 
  FIELD_TYPES, 
  EventFormData, 
  initialFormData, 
  ListField,
  RadioField,
  CheckboxField,
  TextField
} from "@/types";

import FormFieldDropZone from "@/components/EventComponents/FormFieldDropZone";
import EventFormFields from "@/components/EventComponents/EventFormFields";
import CustomFieldsList from "@/components/EventComponents/CustomFieldsList";
import DraggableField from "@/components/EventComponents/DraggebleField";
import { toast } from "sonner";
import { createEvent } from "@/lib/api";

const CreateEventForm = () => {
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [formFields, setFormFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);

  // Event form field handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev: EventFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (dates: string[]): void => {
    setFormData((prev) => ({
      ...prev,
      eventDates: {
        ...prev.eventDates,
        dates: dates,
      },
    }));
  };

  const handlePlaceChange = (places: string[]): void => {
    setFormData((prev) => ({
      ...prev,
      place: {
        ...prev.place,
        places: places,
      },
    }));
  };

  const handleAllowUserAddChange = (fieldName: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (fieldName === "eventDates") {
      setFormData((prev) => ({
        ...prev,
        eventDates: {
          ...prev.eventDates,
          allowUserAdd: e.target.checked,
        },
      }));
    } else if (fieldName === "place") {
      setFormData((prev) => ({
        ...prev,
        place: {
          ...prev.place,
          allowUserAdd: e.target.checked,
        },
      }));
    }
  };

  const handleMaxValuesChange = (fieldName: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const maxValue = parseInt(e.target.value) || 0;
    
    if (fieldName === "eventDates") {
      setFormData((prev) => {
        const currentDates = [...prev.eventDates.dates];
        const newDates =
          maxValue > 0 && currentDates.length > maxValue
            ? currentDates.slice(0, maxValue)
            : currentDates;

        return {
          ...prev,
          eventDates: {
            ...prev.eventDates,
            maxDates: maxValue,
            dates: newDates,
          },
        };
      });
    } else if (fieldName === "place") {
      setFormData((prev) => {
        const currentPlaces = [...prev.place.places];
        const newPlaces =
          maxValue > 0 && currentPlaces.length > maxValue
            ? currentPlaces.slice(0, maxValue)
            : currentPlaces;

        return {
          ...prev,
          place: {
            ...prev.place,
            maxPlaces: maxValue,
            places: newPlaces,
          },
        };
      });
    }
  };

  // Custom field handlers
  const handleFieldDrop = (fieldType: FieldType): void => {
    if (fieldType === FIELD_TYPES.LIST) {
      const listField: ListField = {
        type: "list", // Use literal "list" instead of FIELD_TYPES.LIST
        id: Date.now(),
        title: "New Field",
        placeholder: "Value here",
        value: "",
        required: false,
        readonly: false,
        values: [""],
        maxEntries: 0,
        allowUserAdd: true,
      };
      setFormFields([...formFields, listField]);
    } else if (fieldType === FIELD_TYPES.RADIO) {
      const radioField: RadioField = {
        type: "radio",
        id: Date.now(),
        title: "New Field",
        placeholder: "Value here",
        value: "",
        required: false,
        readonly: false,
        options: [
          { id: Date.now(), label: "Option 1" },
          { id: Date.now() + 1, label: "Option 2" },
        ],
        selectedOption: null,
        maxOptions: 0,
        allowUserAddOptions: false,
      };
      setFormFields([...formFields, radioField]);
    } else if (fieldType === FIELD_TYPES.CHECKBOX) {
      const checkboxField: CheckboxField = {
        type: "checkbox",
        id: Date.now(),
        title: "New Field",
        placeholder: "Value here",
        value: "",
        required: false,
        readonly: false,
        options: [
          { id: Date.now(), label: "Option 1", checked: false },
          { id: Date.now() + 1, label: "Option 2", checked: false },
        ],
        maxOptions: 0,
        allowUserAddOptions: false,
      };
      setFormFields([...formFields, checkboxField]);
    } else {
      const textField: TextField = {
        type: "text",
        id: Date.now(),
        title: "New Field",
        placeholder: "Value here",
        value: "",
        required: false,
        readonly: false,
      };
      setFormFields([...formFields, textField]);
    }
  };

  const updateFieldTitle = (id: number, title: string) => {
    setFormFields(
      formFields.map((field) => (field.id === id ? { ...field, title } : field))
    );
  };

  const updateFieldValue = (id: number, value: string) => {
    setFormFields(
      formFields.map((field) => (field.id === id ? { ...field, value } : field))
    );
  };

  const updateFieldSettings = (id: number, settings: FieldSettings): void => {
    setFormFields(
      formFields.map((field) =>
        field.id === id ? { ...field, ...settings } : field
      )
    );
  };

  // Form submission
  const handleSubmit = async  (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    try {
      const validationData = {
        name: formData.name,
        description: formData.description,
        eventDates: {
          dates: formData.eventDates.dates,
          maxDates: formData.eventDates.maxDates,
          allowUserAdd: formData.eventDates.allowUserAdd,
        },
        place: {
          places: formData.place.places,
          maxPlaces: formData.place.maxPlaces,
          allowUserAdd: formData.place.allowUserAdd,
        },
        formFields: formFields,
      };

      // First validate the structure with Zod
      const validationResult = eventFormSchema.safeParse(validationData);

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new Error(firstError.message);
      }

      // Then use the custom validator for field-specific validation
      const customValidationResult = validateForm(validationResult.data);
      if (customValidationResult !== true) {
        throw new Error(customValidationResult);
      }

      // If validation passes, prepare event data
      const validDates = formData.eventDates.dates.filter(
        (date) => date.trim() !== ""
      );

      const validPlaces = formData.place.places.filter(
        (place) => place.trim() !== ""
      );

      const dateOptions = validDates.map((date) => ({
        optionName: new Date(date).toISOString(),
        votes: [],
      }));

      const placeOptions = validPlaces.map((place) => ({
        optionName: place,
        votes: [],
      }));

      const votingCategories = [
        {
          categoryName: "date",
          options: dateOptions,
        },
        {
          categoryName: "place",
          options: placeOptions,
        }
      ];

      // Create a properly structured customFields object
      const customFields: Record<string, any> = {};
      
      formFields.forEach(field => {
        // Use a unique key for each field (using title as the key)
        const fieldKey = field.title || `field_${field.id}`;
        
        // Start with common properties for all field types
        const fieldData: Record<string, any> = {
          id: field.id,
          type: field.type,
          title: field.title,
          placeholder: field.placeholder,
          required: field.required
        };
        
        // Add type-specific properties
        switch (field.type) {
          case 'text': {
            const textField = field as TextField;
            fieldData.value = textField.value;
            fieldData.readonly = textField.readonly;
            // Add optional property (derived from !required && !readonly)
            fieldData.optional = !textField.required && !textField.readonly;
            break;
          }
          
          case 'list': {
            const listField = field as ListField;
            fieldData.values = listField.values.filter(value => value.trim() !== "");
            fieldData.maxEntries = listField.maxEntries;
            fieldData.allowUserAdd = listField.allowUserAdd;
            fieldData.readonly = listField.readonly;
            // Add optional property (derived from !required && !readonly)
            fieldData.optional = !listField.required && !listField.readonly;
            break;
          }
          
          case 'radio': {
            const radioField = field as RadioField;
            fieldData.options = radioField.options.map(opt => ({
              id: opt.id,
              label: opt.label
            }));

            fieldData.maxOptions = radioField.maxOptions;
            fieldData.allowUserAddOptions = radioField.allowUserAddOptions;
            
            // Add optional property (derived from !required)
            fieldData.optional = !radioField.required;

            votingCategories.push({
              categoryName: field.title,
              options: fieldData.options.map(option => ({
                optionName: option.label,
                votes: [],
              }))
            });

            break;
          }
          
          case 'checkbox': {
            const checkboxField = field as CheckboxField;
            fieldData.options = checkboxField.options.map(opt => ({
              id: opt.id,
              label: opt.label,
            }));
            
              
            fieldData.maxOptions = checkboxField.maxOptions;
            fieldData.allowUserAddOptions = checkboxField.allowUserAddOptions;
            
            // Add optional property (derived from !required)
            fieldData.optional = !checkboxField.required;

            votingCategories.push({
              categoryName: field.title,
              options: fieldData.options.map(option => ({
                optionName: option.label,
                votes: [],
              }))
            });
            
            break;
          }
        }
        
        // Add the field data to the customFields object
        customFields[fieldKey] = fieldData;
      });

      // Create the event data with the updated structure
      const eventData = {
        name: formData.name,
        description: formData.description,
        customFields,
        eventDates: {
          dates: validDates.map((date) => new Date(date).toISOString()),
          maxDates: formData.eventDates.maxDates,
          allowUserAdd: formData.eventDates.allowUserAdd,
        },
        eventPlaces: {
          places: validPlaces,
          maxPlaces: formData.place.maxPlaces,
          allowUserAdd: formData.place.allowUserAdd,
        },
        votingCategories
      };

      // Submit the form
      console.log("Event Data:", eventData);
      const response = await createEvent(eventData);
      console.log(response);
      toast.custom(() => (
        <div className="bg-white text-green-800 font-medium p-4 rounded-md shadow-lg border-l-4 border-green-600">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h3 className="font-bold text-base">Event created successfully!</h3>
              <p className="text-sm text-gray-800 mt-1">
                Your event has been created and is now ready to share.
              </p>
            </div>
          </div>
        </div>
      ), {
        duration: 5000,
        id: 'success-toast',
      });
      // await submitEvent(eventData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      console.error("Form submission error:", errorMessage);
      toast.custom(() => (
        <div className="bg-white text-red-900 font-medium p-4 rounded-md shadow-lg border-l-4 border-red-600">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h3 className="font-bold text-base">Error creating event</h3>
              <p className="text-sm text-gray-800 mt-1">{errorMessage}</p>
            </div>
          </div>
        </div>
      ), {
        duration: 5000,
        id: 'error-toast',
      });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-purple-950">
        <Navbar />
        <div className="pt-20 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-12 gap-8">
                {/* Draggable Fields Sidebar */}
                <div className="col-span-2 bg-purple-900/40 rounded-xl p-6 border border-purple-700/50 h-fit sticky top-24">
                  <h2 className="text-xl font-semibold text-purple-100 mb-4">
                    Form Fields
                  </h2>
                  <div className="space-y-2">
                    <DraggableField type={FIELD_TYPES.TEXT} />
                    <DraggableField type={FIELD_TYPES.LIST} />
                    <DraggableField type={FIELD_TYPES.RADIO} />
                    <DraggableField type={FIELD_TYPES.CHECKBOX} />
                  </div>
                </div>

                {/* Form Builder Area */}
                <div className="col-span-10 bg-purple-900/40 rounded-xl p-8 border border-purple-700/50">
                  <h1 className="text-4xl font-bold text-purple-100 mb-8">
                    Create New Event
                  </h1>

                  {/* Standard Form Fields */}
                  <EventFormFields
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleDateChange={handleDateChange}
                    handleAllowUserAddChange={handleAllowUserAddChange}
                    handleMaxValuesChange={handleMaxValuesChange}
                    handlePlaceChange={handlePlaceChange}
                  />

                  {/* Custom Fields Drop Zone */}
                  <div className="mb-8" id="drop-zone-section">
                    <h2 className="text-xl font-semibold text-purple-100 mb-4">
                      Custom Fields
                    </h2>
                    <FormFieldDropZone onDrop={(fieldType) => {
                      handleFieldDrop(fieldType);
                      // Scroll to the bottom of the custom fields list after dropping
                      setTimeout(() => {
                        window.scrollTo({
                          top: document.documentElement.scrollHeight,
                          behavior: "smooth"
                        });
                      }, 100);
                    }} />
                  </div>

                  {/* Added Fields Display */}
                  <CustomFieldsList
                    formFields={formFields}
                    selectedFieldId={selectedFieldId}
                    setSelectedFieldId={setSelectedFieldId}
                    updateFieldTitle={updateFieldTitle}
                    updateFieldValue={updateFieldValue}
                    updateFieldSettings={updateFieldSettings}
                    setFormFields={setFormFields}
                  />

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-purple-200 text-purple-950 hover:bg-purple-100"
                    >
                      Create Event
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default CreateEventForm;