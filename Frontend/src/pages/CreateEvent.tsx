import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  MapPin,
  Plus,
  X,
  GripVertical,
  Settings,
} from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import Navbar from "@/components/Navbar";
import FieldOptions from "@/components/FieldOptions";

const FIELD_TYPES = {
  TEXT: "text",
  LIST: "list",
  RADIO: "radio"
};

// Draggable Field Component
const DraggableField = ({ type }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "field",
    item: { type },
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
         type === FIELD_TYPES.LIST ? "List Field" : "Radio Field"}
      </span>
    </div>
  );
};

// Form Field Drop Zone
const FormFieldDropZone = ({ onDrop }) => {
  const [{ isOver }, drop] = useDrop({
    accept: "field",
    drop: (item) => onDrop(item.type),
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

const CreateEventForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventDate: "",
    place: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [formFields, setFormFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);

  const handleFieldDrop = (fieldType) => {
    const baseField = {
      type: fieldType,
      id: Date.now(),
      title: "New Field",
      placeholder: "Value here",
      value: "",
      required: false,
      readonly: false,
    };
  
    let field;
    if (fieldType === FIELD_TYPES.LIST) {
      field = {
        ...baseField,
        values: [""],
        maxEntries: 0,
        allowUserAdd: true,
      };
    } else if (fieldType === FIELD_TYPES.RADIO) {
      field = {
        ...baseField,
        options: [
          { id: Date.now(), label: "Option 1" },
          { id: Date.now() + 1, label: "Option 2" }
        ],
        selectedOption: null
      };
    } else {
      field = baseField;
    }
  
    setFormFields([...formFields, field]);
  };

  const updateFieldTitle = (id, title) => {
    setFormFields(
      formFields.map((field) => (field.id === id ? { ...field, title } : field))
    );
  };

  const updateFieldValue = (id, value) => {
    setFormFields(
      formFields.map((field) => (field.id === id ? { ...field, value } : field))
    );
  };

  const updateFieldSettings = (id, settings) => {
    setFormFields(
      formFields.map((field) =>
        field.id === id ? { ...field, ...settings } : field
      )
    );
  };

  const selectedField = formFields.find(
    (field) => field.id === selectedFieldId
  );

  const handleSubmit = (e) => {
    e.preventDefault();
  
    try {
      // Validate fields before submission
      // Inside handleSubmit function, replace the validation section:
formFields.forEach(field => {
  // Check if field has a title
  if (!field.title.trim()) {
    throw new Error("All fields must have a title");
  }

  const isOptional = !field.required && !field.readonly;
  
  if (field.type === FIELD_TYPES.TEXT) {
    if (field.readonly) {
      // For readonly text fields: must have a value
      if (!field.value.trim()) {
        throw new Error(`${field.title}: Read-only text fields must have a value`);
      }
    } else if ((field.required || isOptional) && field.value.trim() !== '') {
      // For required/optional text fields: must be empty
      throw new Error(
        `${field.title}: ${field.required ? 'Required' : 'Optional'} text fields must be empty for form creation`
      );
    }
 // Inside handleSubmit function, replace the list field validation section:
} else if (field.type === FIELD_TYPES.LIST) {
  const nonEmptyValues = field.values.filter(v => v.trim() !== '');
  
  if (field.readonly) {
    // For readonly list fields: all entries must have values
    if (field.maxEntries > 0) {
      // If max entries is set
      if (field.values.length < field.maxEntries) {
        throw new Error(
          `${field.title}: Read-only list must have exactly ${field.maxEntries} entries. Currently has ${field.values.length}`
        );
      }
      if (nonEmptyValues.length !== field.maxEntries) {
        throw new Error(
          `${field.title}: All ${field.maxEntries} entries in read-only list must have values`
        );
      }
    } else {
      // If unlimited entries
      if (field.values.some(v => !v.trim())) {
        throw new Error(
          `${field.title}: All entries in read-only list must have values`
        );
      }
    }
  } else if (field.required || !field.required) { // Handle both required and optional cases
    const hasEmptyField = field.values.some(v => v.trim() === '');
    const hasRoomForMore = field.maxEntries === 0 || field.values.length < field.maxEntries;
    
    // Check if users can add entries
    if (!field.allowUserAdd) {
      // If users can't add entries, we must provide an empty field
      if (!hasEmptyField) {
        throw new Error(
          `${field.title}: Must include an empty field for user input since users cannot add their own entries`
        );
      }
    } 
    
    else {
      // If users can add entries, either need an empty field or room for more
      if (!hasEmptyField && !hasRoomForMore) {
        throw new Error(
          `${field.title}: Must either have an empty field or room for more entries`
        );
      }
    }

    // Additional validation for max entries
    if (field.maxEntries > 0 && field.values.length > field.maxEntries) {
      throw new Error(
        `${field.title}: Number of fields (${field.values.length}) exceeds maximum allowed (${field.maxEntries})`
      );
    }
  }
}else if (field.type === FIELD_TYPES.RADIO) {
  // Check if all options have labels
  if (field.options.some(opt => !opt.label.trim())) {
    throw new Error(`${field.title}: All radio options must have labels`);
  }

  // Need at least 2 options
  if (field.options.length < 2) {
    throw new Error(`${field.title}: Radio fields must have at least 2 options`);
  }

  if (field.readonly) {
    // For readonly fields, must have a selected option
    if (!field.selectedOption) {
      throw new Error(`${field.title}: Read-only radio fields must have a selected option`);
    }
  } else {
    // For required/optional fields, should not have a selection during creation
    if (field.selectedOption) {
      throw new Error(
        `${field.title}: ${field.required ? 'Required' : 'Optional'} radio fields should not have a selection during creation`
      );
    }
  }
}
});
  
      // Transform custom fields into the required format
      const customFieldsObject = formFields.reduce((acc, field) => {
        const isOptional = !field.required && !field.readonly;
        
        const fieldData = {
          type: field.type,
          placeholder: field.placeholder,
          required: field.required,
          readonly: field.readonly,
          optional: isOptional,
          title: field.title,
        };

        if (field.type === FIELD_TYPES.RADIO) {
          fieldData.options = field.options.map(opt => ({
            id: opt.id,
            label: opt.label
          }));
  
        }

  
        if (field.type === FIELD_TYPES.LIST) {
          fieldData.maxEntries = field.maxEntries;
          fieldData.allowUserAdd = field.allowUserAdd;
          // Only include non-empty values for readonly fields
          fieldData.values = field.readonly 
            ? field.values.filter(v => v.trim() !== '')
            : field.values;
        } else {
          // Only include value for readonly fields
          fieldData.value = field.readonly ? field.value : '';
        }
  
        acc[field.title] = fieldData;
        return acc;
      }, {});
  
      const eventData = {
        name: formData.name,
        description: formData.description,
        eventDate: formData.eventDate
          ? new Date(formData.eventDate).toISOString()
          : null,
        place: formData.place || null,
        customFields: customFieldsObject,
        votingCategories: [
          {
            categoryName: "date",
            options: formData.eventDate
              ? [{ optionName: new Date(formData.eventDate).toISOString(), votes: [] }]
              : [],
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
      
      // Add radio fields as voting categories (only once)
      formFields.forEach(field => {
        if (field.type === FIELD_TYPES.RADIO) {
          eventData.votingCategories.push({
            categoryName: field.title,
            options: field.options.map(opt => ({
              optionName: opt.label,
              votes: []
            }))
          });
        }
      });
  
      console.log("Form Fields:", formFields);
      console.log("Custom Fields Object:", customFieldsObject);
      console.log("Event Data:", eventData);
      
      // Here you would submit the data
      // await submitEvent(eventData);
      
    } catch (error) {
      console.error("Form submission error:", error.message);
      // You should show this error to the user in your UI
      alert(error.message); // Replace with proper error handling UI
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
                  </div>
                </div>

                {/* Form Builder Area */}
                <div className="col-span-7 bg-purple-900/40 rounded-xl p-8 border border-purple-700/50">
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
                      <label className="block text-purple-100 mb-2">Date</label>
                      <div className="relative group cursor-pointer">
                        <Input
                          type="datetime-local"
                          name="eventDate"
                          value={formData.eventDate}
                          onChange={handleInputChange}
                          className="bg-purple-800/50 border-purple-600 text-purple-100 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          onClick={(e) => {
                            const input = e.currentTarget;
                            input.showPicker();
                          }}
                        />
                        <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-purple-400 pointer-events-none group-hover:text-purple-200 transition-colors" />
                      </div>
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

                  {/* Added Fields Display */}
                  {formFields.length > 0 && (
                    <div className="space-y-4 mb-8">
                      <h3 className="text-lg font-medium text-purple-100">
                        Added Fields
                      </h3>
                      {formFields.map((field) => (
                        <div
                          key={field.id}
                          className="bg-purple-800/20 p-4 rounded-lg space-y-3"
                        >
                          <div className="flex items-center gap-2">
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
                              onClick={() => setSelectedFieldId(field.id)}
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

                          {/* Add this alongside your text and list field conditions */}
{field.type === FIELD_TYPES.RADIO && (
  <div className="space-y-2 mt-2">
    {field.options.map((option) => (
      <div key={option.id} className="flex items-center gap-2">
        <input
          type="radio"
          checked={field.selectedOption === option.id}
          onChange={() => 
            updateFieldSettings(field.id, { selectedOption: option.id })
          }
          className="text-purple-600 border-purple-400 bg-purple-800/50 focus:ring-purple-500 focus:ring-offset-purple-900"
        />
        <Input
          value={option.label}
          onChange={(e) => {
            const newOptions = field.options.map(opt =>
              opt.id === option.id ? { ...opt, label: e.target.value } : opt
            );
            updateFieldSettings(field.id, { options: newOptions });
          }}
          className="bg-purple-800/50 border-purple-600 text-purple-100"
          placeholder="Option label"
        />
        {field.options.length > 2 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const newOptions = field.options.filter(opt => opt.id !== option.id);
              updateFieldSettings(field.id, { options: newOptions });
            }}
            className="text-purple-100 hover:text-white hover:bg-purple-800"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    ))}
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => {
        const newOptions = [
          ...field.options,
          { id: Date.now(), label: "" }
        ];
        updateFieldSettings(field.id, { options: newOptions });
      }}
      className="text-purple-100 hover:text-white hover:bg-purple-800 w-full"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Option
    </Button>
  </div>
)}

                          {/* List field rendering */}
                          {field.type === FIELD_TYPES.LIST && (
                            <div className="space-y-2 mt-2">
                              {field.values.map((value, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    value={value}
                                    onChange={(e) => {
                                      const newValues = [...field.values];
                                      newValues[index] = e.target.value;
                                      updateFieldSettings(field.id, {
                                        values: newValues,
                                      });
                                    }}
                                    className="bg-purple-800/50 border-purple-600 text-purple-100"
                                    placeholder={field.placeholder}
                                  />
                                  {field.values.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newValues = field.values.filter(
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
                              {(!field.maxEntries ||
                                field.values.length < field.maxEntries) && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newValues = [...field.values, ""];
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

                {/* Field Editor Sidebar */}
                <div className="col-span-3">
                  {selectedField ? (
                    <div className="bg-purple-900/40 rounded-xl p-6 border border-purple-700/50 h-fit">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-purple-100">
                          Edit Field
                        </h2>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedFieldId(null)}
                          className="text-purple-100 hover:text-white hover:bg-purple-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-purple-100 mb-2">
                            Placeholder Text
                          </label>
                          <Input
                            value={selectedField.placeholder}
                            onChange={(e) =>
                              updateFieldSettings(selectedField.id, {
                                placeholder: e.target.value,
                              })
                            }
                            className="bg-purple-800/50 border-purple-600 text-purple-100"
                            placeholder="Enter placeholder text"
                          />
                        </div>

                        {/* List-specific settings */}
                        {selectedField.type === FIELD_TYPES.LIST && (
                          <>
                            <div>
                              <label className="block text-purple-100 mb-2">
                                Maximum Entries
                              </label>
                              <Input
                                type="number"
                                min="0"
                                value={selectedField.maxEntries}
                                onChange={(e) =>
                                  updateFieldSettings(selectedField.id, {
                                    maxEntries: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="bg-purple-800/50 border-purple-600 text-purple-100"
                                placeholder="0 for unlimited"
                              />
                              <p className="text-purple-400 text-sm mt-1">
                                Set to 0 for unlimited entries. This limit
                                applies to both creation and submission.
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="allowUserAdd"
                                  checked={selectedField.allowUserAdd}
                                  onChange={(e) =>
                                    updateFieldSettings(selectedField.id, {
                                      allowUserAdd: e.target.checked,
                                    })
                                  }
                                  className="rounded border-purple-600 bg-purple-800/50 text-purple-600 focus:ring-purple-500"
                                />
                                <label
                                  htmlFor="allowUserAdd"
                                  className="text-purple-200"
                                >
                                  Allow users to add entries
                                </label>
                              </div>
                              <p className="text-purple-400 text-sm mt-1">
                                This setting only applies when users fill out
                                the form, not during creation.
                              </p>
                            </div>
                          </>
                        )}
                          <FieldOptions 
  field={selectedField} 
  onUpdate={(updates) => updateFieldSettings(selectedField.id, updates)} 
/>
                        {/* <div className="space-y-4">
                          <label className="block text-purple-100">
                            Field Options
                          </label>
                          <div className="flex gap-4">
                            <Button
                              type="button"
                              variant={
                                selectedField.required ? "secondary" : "ghost"
                              }
                              className={`flex-1 ${
                                selectedField.required
                                  ? "bg-purple-200 text-purple-950 hover:bg-purple-100"
                                  : "text-purple-100 hover:text-white hover:bg-purple-800"
                              } ${
                                selectedField.readonly
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              onClick={() => {
                                if (!selectedField.readonly) {
                                  updateFieldSettings(selectedField.id, {
                                    required: !selectedField.required,
                                  });
                                }
                              }}
                              disabled={selectedField.readonly}
                            >
                              Required
                            </Button>
                            <Button
                              type="button"
                              variant={
                                selectedField.readonly ? "secondary" : "ghost"
                              }
                              className={`flex-1 ${
                                selectedField.readonly
                                  ? "bg-purple-200 text-purple-950 hover:bg-purple-100"
                                  : "text-purple-100 hover:text-white hover:bg-purple-800"
                              } ${
                                selectedField.required
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              onClick={() => {
                                if (!selectedField.required) {
                                  updateFieldSettings(selectedField.id, {
                                    readonly: !selectedField.readonly,
                                  });
                                }
                              }}
                              disabled={selectedField.required}
                            >
                              Readonly
                            </Button>
                          </div>
                          <p className="text-purple-400 text-sm">
                            These settings will apply when users fill out the
                            form, not during creation. You cannot set a field as
                            both required and readonly.
                          </p>
                        </div> */}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-purple-900/40 rounded-xl p-6 border border-purple-700/50 h-fit">
                      <p className="text-purple-300 text-center">
                        Select a field to edit its properties
                      </p>
                    </div>
                  )}
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
