import React, { useState  } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Plus,
  X,
  GripVertical,
  Settings,
} from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import Navbar from "@/components/NavBar";
import FieldOptions from "@/components/FieldOptions";
import MultiDateField from "@/components/MultiDateField";
import { eventFormSchema, validateForm } from "@/lib/validations/event.schemas";

type FieldType = 'text' | 'list' | 'radio' | 'checkbox';

const FIELD_TYPES: Record<string, FieldType> = {
  TEXT: "text",
  LIST: "list",
  RADIO: "radio",
  CHECKBOX: "checkbox"
};

interface BaseField {
  id: number;
  type: FieldType;
  title: string;
  placeholder: string;
  value: string;
  required: boolean;
  readonly: boolean;
}

interface TextField extends BaseField {
  type: 'text';
}

interface RadioField extends BaseField {
  type: 'radio';
  options: Array<{
    id: number;
    label: string;
  }>;
  selectedOption: number | null;
  maxOptions: number;         // New property: max number of options
  allowUserAddOptions: boolean; // New property: whether users can add options
}

interface CheckboxField extends BaseField {
  type: 'checkbox';
  options: Array<{
    id: number;
    label: string;
    checked: boolean;
  }>;
  maxOptions: number;         // New property: max number of options
  allowUserAddOptions: boolean; // New property: whether users can add options
}

interface ListField extends BaseField {
  type: 'list';
  values: string[];
  maxEntries: number;
  allowUserAdd: boolean;
}

type Field = TextField | ListField | RadioField | CheckboxField;

type TextFieldSettings = Partial<Omit<TextField, 'id' | 'type'>>;
type ListFieldSettings = Partial<Omit<ListField, 'id' | 'type'>>;
type RadioFieldSettings = Partial<Omit<RadioField, 'id' | 'type'>>;
type CheckboxFieldSettings = Partial<Omit<CheckboxField, 'id' | 'type'>>;
type FieldSettings = TextFieldSettings | ListFieldSettings | RadioFieldSettings | CheckboxFieldSettings;

interface DragItem {
  type: FieldType;
}

interface FormFieldDropZoneProps {
  onDrop: (type: FieldType) => void;
}

interface DraggableFieldProps {
  type: FieldType;
}

// Draggable Field Component
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
        {type === FIELD_TYPES.TEXT ? "Text Field" : 
         type === FIELD_TYPES.LIST ? "List Field" : 
         type === FIELD_TYPES.CHECKBOX ? "Checkbox Field" : "Radio Field"}
      </span>
    </div>
  );
};

// Form Field Drop Zone
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

interface EventFormData {
  name: string;
  description: string;
  eventDates: {
    dates: string[]; 
    maxDates: number;
  };
  place: string;
}

const initialFormData: EventFormData = {
  name: "",
  description: "",
  eventDates: {
    dates: [""], 
    maxDates: 0
  },
  place: "",
};

const CreateEventForm = () => {
  const [formData, setFormData] = useState<EventFormData>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev: EventFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (dates: string[]): void => {
    setFormData((prev) => {
      // Create a completely new object to avoid type issues
      return {
        name: prev.name,
        description: prev.description,
        place: prev.place,
        eventDates: {
          maxDates: prev.eventDates.maxDates,
          dates: dates // Use the dates parameter directly
        }
      };
    });
  };
  
  const handleMaxDatesChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const maxDates = parseInt(e.target.value) || 0;
    setFormData((prev) => {
      // Get the current dates
      const currentDates = [...prev.eventDates.dates];
      
      // Apply the trim logic
      const newDates = maxDates > 0 && currentDates.length > maxDates
        ? currentDates.slice(0, maxDates)
        : currentDates;
      
      // Return a fully typed new state object
      return {
        name: prev.name,
        description: prev.description,
        place: prev.place,
        eventDates: {
          maxDates: maxDates,
          dates: newDates
        }
      };
    });
  };

  const [formFields, setFormFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);

  const handleFieldDrop = (fieldType: FieldType): void => {
    // Create the appropriate field based on type
    if (fieldType === FIELD_TYPES.LIST) {
      const listField: ListField = {
        type: 'list',
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
        type: 'radio',
        id: Date.now(),
        title: "New Field",
        placeholder: "Value here",
        value: "",
        required: false,
        readonly: false,
        options: [
          { id: Date.now(), label: "Option 1" },
          { id: Date.now() + 1, label: "Option 2" }
        ],
        selectedOption: null,
        maxOptions: 0,              // Initialize with 0 (unlimited)
        allowUserAddOptions: false  // Initialize with false
      };
      setFormFields([...formFields, radioField]);
    } else if (fieldType === FIELD_TYPES.CHECKBOX) {
      const checkboxField: CheckboxField = {
        type: 'checkbox',
        id: Date.now(),
        title: "New Field",
        placeholder: "Value here",
        value: "",
        required: false,
        readonly: false,
        options: [
          { id: Date.now(), label: "Option 1", checked: false },
          { id: Date.now() + 1, label: "Option 2", checked: false }
        ],
        maxOptions: 0,              // Initialize with 0 (unlimited)
        allowUserAddOptions: false  // Initialize with false
      };
      setFormFields([...formFields, checkboxField]);
    } else {
      const textField: TextField = {
        type: 'text',
        id: Date.now(),
        title: "New Field",
        placeholder: "Value here",
        value: "",
        required: false,
        readonly: false
      };
      setFormFields([...formFields, textField]);
    }
  };

  const updateFieldTitle = (id:number, title:string) => {
    setFormFields(
      formFields.map((field) => (field.id === id ? { ...field, title } : field))
    );
  };

  const updateFieldValue = (id:number, value:string) => {
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

  const selectedField = formFields.find(
    (field) => field.id === selectedFieldId
  );

// Replace your current handleSubmit function with this version
// Updated handleSubmit function to work with the new schema structure
const handleSubmit = (e: React.FormEvent): void => {
  e.preventDefault();

  try {
    // Use Zod for validation with the new structure
    const validationData = {
      name: formData.name,
      description: formData.description,
      // Pass the whole eventDates object now
      eventDates: {
        dates: formData.eventDates.dates,
        maxDates: formData.eventDates.maxDates,
      },
      place: formData.place,
      formFields: formFields
    };
    
    // First validate the structure with Zod
    const validationResult = eventFormSchema.safeParse(validationData);
    
    if (!validationResult.success) {
      // Extract the first error message
      const firstError = validationResult.error.errors[0];
      throw new Error(firstError.message);
    }
    
    // Then use the custom validator for field-specific validation
    const customValidationResult = validateForm(validationResult.data);
    if (customValidationResult !== true) {
      throw new Error(customValidationResult);
    }
    
    // If validation passes, continue with the existing logic
    // Filter valid dates from the structure
    const validDates = formData.eventDates.dates.filter(date => date.trim() !== '');

    const dateOptions = validDates.map(date => ({
      optionName: new Date(date).toISOString(),
      votes: []
    }));

    // Transform custom fields into the required format
    const customFieldsObject = formFields.reduce((acc: Record<string, any>, field) => {
      const isOptional = !field.required && !field.readonly;
      
      const fieldData = {
        type: field.type,
        placeholder: field.placeholder,
        required: field.required,
        readonly: field.readonly,
        optional: isOptional,
        title: field.title,
      };

      if (field.type === FIELD_TYPES.CHECKBOX) {
        const checkboxField = field as CheckboxField;
        fieldData.options = checkboxField.options.map(opt => ({
          id: opt.id,
          label: opt.label,
          checked: opt.checked
        }));
        fieldData.maxOptions = checkboxField.maxOptions; // Add the new properties
        fieldData.allowUserAddOptions = checkboxField.allowUserAddOptions;
      }

      if (field.type === FIELD_TYPES.CHECKBOX) {
        const checkboxField = field as CheckboxField;
        fieldData.options = checkboxField.options.map(opt => ({
          id: opt.id,
          label: opt.label,
          checked: opt.checked
        }));
      }

      if (field.type === FIELD_TYPES.LIST) {
        const listField = field as ListField;
        fieldData.maxEntries = listField.maxEntries;
        fieldData.allowUserAdd = listField.allowUserAdd;
        // Only include non-empty values for readonly fields
        fieldData.values = field.readonly 
          ? listField.values.filter(v => v.trim() !== '')
          : listField.values;
      } else {
        // Only include value for readonly fields
        fieldData.value = field.readonly ? field.value : '';
      }

      acc[field.title] = fieldData;
      return acc;
    }, {});
    
    // Create the event data with the updated structure
    const eventData = {
      name: formData.name,
      description: formData.description,
      place: formData.place || null,
      customFields: {
        ...customFieldsObject
      },
      // Use the consolidated eventDates structure
      eventDates: {
        dates: validDates.map(date => new Date(date).toISOString()),
        maxDates: formData.eventDates.maxDates
      },
      votingCategories: [
        {
          categoryName: "date",
          options: dateOptions
        },
        {
          categoryName: "time",
          options: [],
        },
        {
          categoryName: "place",
          options: formData.place
            ? [{ optionName: formData.place, votes: [] }]
            : [],
        },
      ],
    };
    
    // The rest of your submit handler remains the same
    console.log("Form Fields:", formFields);
    console.log("Custom Fields Object:", customFieldsObject);
    console.log("Event Data:", eventData);
    
    // Here you would submit the data
    // await submitEvent(eventData);
    
  } catch (error) {
    // Create a properly typed error object
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
      
    console.error("Form submission error:", errorMessage);
    // You should show this error to the user in your UI
    alert(errorMessage); // Replace with proper error handling UI
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
                <div className="col-span-2 bg-purple-900/40 rounded-xl p-6 border border-purple-700/50 h-fit">
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
  
                {/* Form Builder Area - expanded to col-span-10 */}
                <div className="col-span-10 bg-purple-900/40 rounded-xl p-8 border border-purple-700/50">
                  <h1 className="text-4xl font-bold text-purple-100 mb-8">
                    Create New Event
                  </h1>
  
                  {/* Standard Form Fields */}
                  <div className="space-y-6 mb-8">
                    <div>
                      <label className="block text-purple-100 mb-2">
                        Event Name *
                      </label>
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
                      <label className="block text-purple-100 mb-2">
                        Description *
                      </label>
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
                      <p className="text-purple-400 text-sm mt-1">
                        {formData.eventDates.maxDates === 0 
                          ? "Users can suggest unlimited dates" 
                          : `Users can suggest up to ${formData.eventDates.maxDates} dates`}
                      </p>
                    </div>
  
                    <div>
                      <label className="block text-purple-100 mb-2">
                        Place
                      </label>
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
  
                  {/* Custom Fields Drop Zone */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-purple-100 mb-4">
                      Custom Fields
                    </h2>
                    <FormFieldDropZone onDrop={handleFieldDrop} />
                  </div>
  
                  {/* Added Fields Display with inline settings */}
                  {formFields.length > 0 && (
                    <div className="space-y-4 mb-8">
                      <h3 className="text-lg font-medium text-purple-100">
                        Added Fields
                      </h3>
                      {formFields.map((field) => (
                        <div
                          key={field.id}
                          className="bg-purple-800/20 p-4 rounded-lg"
                        >
                          <div className="flex flex-col">
                            {/* Title and control buttons */}
                            <div className="flex items-center gap-2 mb-3">
                              <Input
                                value={field.title}
                                onChange={(e) =>
                                  updateFieldTitle(field.id, e.target.value)
                                }
                                className="bg-purple-800/50 border-purple-600 text-purple-100 font-medium"
                                placeholder="Field title"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedFieldId(selectedFieldId === field.id ? null : field.id)}
                                className={`text-purple-100 hover:text-white hover:bg-purple-800 ${
                                  selectedFieldId === field.id
                                    ? "bg-purple-800"
                                    : ""
                                }`}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setFormFields(
                                    formFields.filter((f) => f.id !== field.id)
                                  );
                                  if (selectedFieldId === field.id) {
                                    setSelectedFieldId(null);
                                  }
                                }}
                                className="text-purple-100 hover:text-white hover:bg-purple-800"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
  
                            {/* Field content and inline settings */}
                            <div className="flex gap-4">
                              {/* Field content area */}
                              <div className="flex-1 space-y-3">
                                {/* Only show single value input for text fields */}
                                {field.type === FIELD_TYPES.TEXT && (
                                  <Input
                                    value={field.value}
                                    onChange={(e) =>
                                      updateFieldValue(field.id, e.target.value)
                                    }
                                    className="bg-purple-800/50 border-purple-600 text-purple-100"
                                    placeholder={field.placeholder}
                                  />
                                )}
  
                                {/* Radio field rendering */}
                                {field.type === FIELD_TYPES.RADIO && (() => {
  // Create a properly typed variable once for this section
  const radioField = field as RadioField;
  const reachedMaxOptions = radioField.maxOptions > 0 && radioField.options.length >= radioField.maxOptions;
  
  return (
    <div className="space-y-2 mt-2">
      {radioField.options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <input
            type="radio"
            checked={radioField.selectedOption === option.id}
            onChange={() => 
              updateFieldSettings(field.id, { selectedOption: option.id })
            }
            className="text-purple-600 border-purple-400 bg-purple-800/50 focus:ring-purple-500 focus:ring-offset-purple-900"
          />
          <Input
            value={option.label}
            onChange={(e) => {
              const newOptions = radioField.options.map(opt =>
                opt.id === option.id ? { ...opt, label: e.target.value } : opt
              );
              updateFieldSettings(field.id, { options: newOptions });
            }}
            className="bg-purple-800/50 border-purple-600 text-purple-100"
            placeholder="Option label"
          />
          {(radioField.options.length > 2) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const newOptions = radioField.options.filter(opt => opt.id !== option.id);
                updateFieldSettings(field.id, { options: newOptions });
              }}
              className="text-purple-100 hover:text-white hover:bg-purple-800"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      
      {/* Only show Add Option button if max options haven't been reached */}
      {!reachedMaxOptions && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const newOptions = [
              ...radioField.options,
              { id: Date.now(), label: "" }
            ];
            updateFieldSettings(field.id, { options: newOptions });
          }}
          className="text-purple-100 hover:text-white hover:bg-purple-800 w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      )}
      
      {/* Display a message if max options are reached */}
      {reachedMaxOptions && (
        <p className="text-purple-400 text-xs mt-1 italic">
          Maximum number of options reached ({radioField.maxOptions})
        </p>
      )}
    </div>
  );
})()}
  
                                {/* Checkbox field rendering */}
                                {field.type === FIELD_TYPES.CHECKBOX && (() => {
  // Create a properly typed variable once for this section
  const checkboxField = field as CheckboxField;
  const reachedMaxOptions = checkboxField.maxOptions > 0 && checkboxField.options.length >= checkboxField.maxOptions;
  
  return (
    <div className="space-y-2 mt-2">
      {checkboxField.options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={option.checked}
            onChange={() => {
              const newOptions = checkboxField.options.map(opt =>
                opt.id === option.id ? { ...opt, checked: !opt.checked } : opt
              );
              updateFieldSettings(field.id, { options: newOptions });
            }}
            className="rounded text-purple-600 border-purple-400 bg-purple-800/50 focus:ring-purple-500 focus:ring-offset-purple-900"
          />
          <Input
            value={option.label}
            onChange={(e) => {
              const newOptions = checkboxField.options.map(opt =>
                opt.id === option.id ? { ...opt, label: e.target.value } : opt
              );
              updateFieldSettings(field.id, { options: newOptions });
            }}
            className="bg-purple-800/50 border-purple-600 text-purple-100"
            placeholder="Option label"
          />
          {(checkboxField.options.length > 1) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const newOptions = checkboxField.options.filter(opt => opt.id !== option.id);
                updateFieldSettings(field.id, { options: newOptions });
              }}
              className="text-purple-100 hover:text-white hover:bg-purple-800"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      
      {/* Only show Add Option button if max options haven't been reached */}
      {!reachedMaxOptions && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const newOptions = [
              ...checkboxField.options,
              { id: Date.now(), label: "", checked: false }
            ];
            updateFieldSettings(field.id, { options: newOptions });
          }}
          className="text-purple-100 hover:text-white hover:bg-purple-800 w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      )}
      
      {/* Display a message if max options are reached */}
      {reachedMaxOptions && (
        <p className="text-purple-400 text-xs mt-1 italic">
          Maximum number of options reached ({checkboxField.maxOptions})
        </p>
      )}
    </div>
  );
})()}
  
                                {/* List field rendering */}
                                {field.type === FIELD_TYPES.LIST && (
                                  <div className="space-y-2 mt-2">
                                    {(field as ListField).values.map((value, index) => (
                                      <div key={index} className="flex gap-2">
                                        <Input
                                          value={value}
                                          onChange={(e) => {
                                            const newValues = [...(field as ListField).values];
                                            newValues[index] = e.target.value;
                                            updateFieldSettings(field.id, {
                                              values: newValues,
                                            });
                                          }}
                                          className="bg-purple-800/50 border-purple-600 text-purple-100"
                                          placeholder={field.placeholder}
                                        />
                                        {(field as ListField).values.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              const newValues = (field as ListField).values.filter(
                                                (_, i) => i !== index
                                              );
                                              updateFieldSettings(field.id, {
                                                values: newValues,
                                              });
                                            }}
                                            className="text-purple-100 hover:text-white hover:bg-purple-800"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    {(!(field as ListField).maxEntries ||
                                      (field as ListField).values.length < (field as ListField).maxEntries) && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newValues = [...(field as ListField).values, ""];
                                          updateFieldSettings(field.id, {
                                            values: newValues,
                                          });
                                        }}
                                        className="text-purple-100 hover:text-white hover:bg-purple-800 w-full"
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Entry
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
  
                              {/* Inline settings panel */}
                              {selectedFieldId === field.id && (
                                <div className="w-72 bg-purple-900/60 rounded-lg p-4 border border-purple-700/50">
                                  <h4 className="text-lg font-medium text-purple-100 mb-3">Field Settings</h4>
                                  
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-purple-100 mb-2">
                                        Placeholder Text
                                      </label>
                                      <Input
                                        value={field.placeholder}
                                        onChange={(e) =>
                                          updateFieldSettings(field.id, {
                                            placeholder: e.target.value,
                                          })
                                        }
                                        className="bg-purple-800/50 border-purple-600 text-purple-100"
                                        placeholder="Enter placeholder text"
                                      />
                                    </div>
  
                                    {/* List-specific settings */}
                                    {field.type === FIELD_TYPES.LIST && (
                                      <>
                                        <div>
                                          <label className="block text-purple-100 mb-2">
                                            Maximum Entries
                                          </label>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={(field as ListField).maxEntries}
                                            onChange={(e) =>
                                              updateFieldSettings(field.id, {
                                                maxEntries: parseInt(e.target.value) || 0,
                                              })
                                            }
                                            className="bg-purple-800/50 border-purple-600 text-purple-100"
                                            placeholder="0 for unlimited"
                                          />
                                          <p className="text-purple-400 text-sm mt-1">
                                            Set to 0 for unlimited entries.
                                          </p>
                                        </div>
  
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              id={`allowUserAdd-${field.id}`}
                                              checked={(field as ListField).allowUserAdd}
                                              onChange={(e) =>
                                                updateFieldSettings(field.id, {
                                                  allowUserAdd: e.target.checked,
                                                })
                                              }
                                              className="rounded border-purple-600 bg-purple-800/50 text-purple-600 focus:ring-purple-500"
                                            />
                                            <label
                                              htmlFor={`allowUserAdd-${field.id}`}
                                              className="text-purple-200"
                                            >
                                              Allow users to add entries
                                            </label>
                                          </div>
                                        </div>
                                      </>
                                    )}
  
                                    {/* Field options component */}
                                    <FieldOptions 
                                      field={field} 
                                      onUpdate={(updates) => updateFieldSettings(field.id, updates)} 
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
  
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