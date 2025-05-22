import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Navbar from '@/components/NavBar';
import { Loader2, XCircle, Users, List, X, MessageSquare, LayoutDashboard, CheckCircle, UserCircle, Clock, Calendar, MapPin, ListChecks, AlertCircle } from 'lucide-react';
import { getEventForOwner, getFinalizedEvent } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import EventVisualization from '@/components/EventEditComponents/EventVisualization';
import EventStatusManagement from '@/components/EventEditComponents/EventStatusManagement';
import { toast } from 'sonner';
import { validateFinalizations, checkEmptyOptionalFields } from '@/lib/validations/eventFinalize.schemas';
import type { FinalizeSelections as FinalizeSelectionsType } from '@/lib/validations/eventFinalize.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Define TypeScript interfaces
interface Voter {
  _id: string;
  email: string;
  name?: string;
}

interface ChartOption {
  optionName: string;
  voteCount: number;
  voters: string[]; // Array of voter IDs
  voterDetails: Voter[]; // Array of voter objects with details
  addedBy?: any | null;
  isOriginal?: boolean;
}

interface CategoryChartData {
  categoryName: string;
  options: ChartOption[];
}

interface ListFieldChartData {
  fieldId: string;
  categoryName: string;
  fieldType: 'list';
  options: ChartOption[];
}

// Interface for text field responses
interface TextFieldResponse {
  userId: string;
  userEmail: string;
  userName?: string;
  response: string;
}

interface TextFieldResponseData {
  fieldId: string;
  categoryName: string;
  responses: TextFieldResponse[];
}

interface EventOwnerData {
  event: any;
  responses: any[];
  chartsData: CategoryChartData[];
  listFieldsData: ListFieldChartData[];
  textFieldsData: TextFieldResponseData[];
}

// Interface for tracking finalization selections
interface FinalizeSelections {
  categorySelections: Record<string, string>;
  listSelections: Record<string, string[]>;
  textSelections: Record<string, string>;
}

const EventEdit = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'voting' | 'list' | 'text'>('dashboard');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeListField, setActiveListField] = useState<string | null>(null);
  const [activeTextField, setActiveTextField] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<{optionName: string, voterDetails: Voter[]} | null>(null);
  
  // State to track finalization selections
  const [finalizeSelections, setFinalizeSelections] = useState<FinalizeSelections>({
    categorySelections: {},
    listSelections: {},
    textSelections: {}
  });

  // Fetch event data
  const { 
    data: eventData, 
    isLoading, 
    isError, 
    error 
  } = useQuery<EventOwnerData, Error>({
    queryKey: ['eventEdit', eventId],
    queryFn: () => getEventForOwner(eventId || ''),
    enabled: !!eventId,
    onSuccess: (data) => {
      // Set defaults for active categories
      if (data.chartsData && data.chartsData.length > 0) {
        setActiveCategory(data.chartsData[0].categoryName);
      }
      if (data.listFieldsData && data.listFieldsData.length > 0) {
        setActiveListField(data.listFieldsData[0].fieldId);
      }
      if (data.textFieldsData && data.textFieldsData.length > 0) {
        setActiveTextField(data.textFieldsData[0].fieldId);
      }
    }
  });


    // Fetch finalized event data when event is finalized
  const { 
    data: finalizedEventData, 
    isLoading: isFinalizedLoading,
    isError: isFinalizedError 
  } = useQuery<FinalizedEventData>({
    queryKey: ['finalizedEvent', eventData?.event?.eventUUID],
    queryFn: () => getFinalizedEvent(eventData?.event?.eventUUID || ''),
    enabled: !!eventData?.event?.eventUUID && eventData?.event?.status === 'finalized',
  });

  

  // Handler for selection changes from EventVisualization component
  const handleSelectionChange = (selections: FinalizeSelections) => {
    setFinalizeSelections(selections);
  };

  // Function to prepare finalization data
  const prepareFinalizeData = () => {
    if (!eventData) return null;

    // Extract date selection
    const dateSelection = getFinalDateSelection();
    
    // Extract place selection
    const placeSelection = getFinalPlaceSelection();
    
    // Extract custom field selections
    const customFieldSelections = getFinalCustomFieldSelections();
    
    // Return the complete data structure
    return {
      date: dateSelection,
      place: placeSelection,
      customFields: customFieldSelections
    };
  };

  // Helper functions to extract values from the finalize selections
  const getFinalDateSelection = (): string | null => {
    if (!eventData) return null;
    
    const dateCategory = eventData.chartsData.find(c => c.categoryName.toLowerCase() === 'date');
    if (!dateCategory) return null;
    
    // Look for date selection in the category selections
    for (const [key, value] of Object.entries(finalizeSelections.categorySelections)) {
      if (key.startsWith('category-date-')) {
        return value;
      }
    }
    
    return null;
  };
  
  const getFinalPlaceSelection = (): string | null => {
    if (!eventData) return null;
    
    const placeCategory = eventData.chartsData.find(c => c.categoryName.toLowerCase() === 'place');
    if (!placeCategory) return null;
    
    // Look for place selection in the category selections
    for (const [key, value] of Object.entries(finalizeSelections.categorySelections)) {
      if (key.startsWith('category-place-')) {
        return value;
      }
    }
    
    return null;
  };
  
  const getFinalCustomFieldSelections = (): Record<string, any> => {
    if (!eventData) return {};
    
    const customFields: Record<string, any> = {};
    
    // Process selections from voting categories (radio & checkbox fields)
    eventData.chartsData.forEach(category => {
      // Skip date and place categories
      if (category.categoryName.toLowerCase() === 'date' || 
          category.categoryName.toLowerCase() === 'place') {
        return;
      }
      
      // Find the corresponding field ID for this category
      let fieldId = '';
      if (eventData.event.customFields) {
        for (const [key, field] of Object.entries(eventData.event.customFields)) {
          if (field.title === category.categoryName) {
            fieldId = key;
            break;
          }
        }
      }
      
      if (!fieldId) return;
      
      // Collect all selections for this category
      const selections = [];
      for (const [key, value] of Object.entries(finalizeSelections.categorySelections)) {
        if (key.startsWith(`category-${category.categoryName}-`)) {
          selections.push(value);
        }
      }
      
      // Store the selection(s)
      if (selections.length === 1) {
        // For radio fields, store a single value
        customFields[fieldId] = selections[0];
      } else if (selections.length > 1) {
        // For checkbox fields, store an array of values
        customFields[fieldId] = selections;
      }
    });
    
    // Process list field selections
    if (eventData.listFieldsData) {
      eventData.listFieldsData.forEach(field => {
        const fieldSelections = finalizeSelections.listSelections[field.fieldId];
        if (fieldSelections && fieldSelections.length > 0) {
          customFields[field.fieldId] = fieldSelections;
        }
      });
    }
    
    // Process text field selections
    if (eventData.textFieldsData) {
      eventData.textFieldsData.forEach(field => {
        const selectedResponseUserId = finalizeSelections.textSelections[field.fieldId];
        if (selectedResponseUserId) {
          // Find the selected response
          const selectedResponse = field.responses.find(
            response => response.userId === selectedResponseUserId
          );
          if (selectedResponse) {
            customFields[field.fieldId] = selectedResponse.response;
          }
        }
      });
    }
    
    return customFields;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Group fields by type for better organization
  const groupFieldsByType = (selections: Record<string, CustomFieldSelection> | undefined) => {
    if (!selections) return {};
    
    const grouped: Record<string, CustomFieldSelection[]> = {
      text: [],
      radio: [],
      checkbox: [],
      list: []
    };
    
    Object.values(selections).forEach(selection => {
      if (selection.fieldType in grouped) {
        grouped[selection.fieldType].push(selection);
      }
    });
    
    return grouped;
  };

  // Get chart data for currently selected category
  const getVotingChartData = (categoryName: string) => {
    if (!eventData) return null;
    
    const category = eventData.chartsData.find(c => c.categoryName === categoryName);
    
    if (!category) return null;
    
    // Sort options by vote count (descending)
    const sortedOptions = [...category.options].sort((a, b) => b.voteCount - a.voteCount);
    
    // Format labels for display (especially dates)
    const formattedLabels = sortedOptions.map(opt => {
      // If category is "date" and the option name is a valid date string
      if (categoryName.toLowerCase() === "date" && !isNaN(Date.parse(opt.optionName))) {
        return formatDate(opt.optionName);
      }
      return opt.optionName;
    });
    
    return {
      labels: formattedLabels,
      datasets: [
        {
          label: 'Votes',
          data: sortedOptions.map(opt => opt.voteCount),
          backgroundColor: sortedOptions.map(opt => 
            opt.addedBy ? 'rgba(153, 102, 255, 0.6)' : 'rgba(75, 192, 192, 0.6)'
          ),
          borderColor: sortedOptions.map(opt => 
            opt.addedBy ? 'rgb(153, 102, 255)' : 'rgb(75, 192, 192)'
          ),
          borderWidth: 1,
        },
      ],
      // Store the original options for getting voter data
      _rawOptions: sortedOptions
    };
  };

  // Format chart data for list fields
  const getListFieldChartData = (fieldId: string) => {
    if (!eventData || !eventData.listFieldsData) return null;
    
    const field = eventData.listFieldsData.find(f => f.fieldId === fieldId);
    
    if (!field) return null;
    
    // Sort options by count (descending)
    const sortedOptions = [...field.options].sort((a, b) => b.voteCount - a.voteCount);
    
    return {
      labels: sortedOptions.map(opt => opt.optionName),
      datasets: [
        {
          label: 'Count',
          data: sortedOptions.map(opt => opt.voteCount),
          backgroundColor: sortedOptions.map(opt => 
            opt.isOriginal ? 'rgba(75, 192, 192, 0.6)' : 'rgba(153, 102, 255, 0.6)'
          ),
          borderColor: sortedOptions.map(opt => 
            opt.isOriginal ? 'rgb(75, 192, 192)' : 'rgb(153, 102, 255)'
          ),
          borderWidth: 1,
        },
      ],
      // Store the original options for getting voter data
      _rawOptions: sortedOptions
    };
  };

  // Get text field data for currently selected field
  const getTextFieldData = (fieldId: string) => {
    if (!eventData || !eventData.textFieldsData) return null;
    
    return eventData.textFieldsData.find(f => f.fieldId === fieldId);
  };

  // Handle chart click to show voters
  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length === 0) {
      setSelectedOption(null);
      return;
    }

    const { index } = elements[0];
    let rawOptions;
    
    if (activeTab === 'voting') {
      const chartData = getVotingChartData(activeCategory!);
      rawOptions = chartData?._rawOptions;
    } else if (activeTab === 'list') {
      const chartData = getListFieldChartData(activeListField!);
      rawOptions = chartData?._rawOptions;
    }

    if (rawOptions && index < rawOptions.length) {
      const option = rawOptions[index];
      setSelectedOption({
        optionName: option.optionName,
        voterDetails: option.voterDetails
      });
    }
  };

  // Validate finalization selections
  // Replace the existing validateFinalizeSelections function with this updated version
const validateFinalizeSelections = () => {
  if (!eventData) return false;
  
  // Enhanced debugging - log the current state of selections and fields
  console.log("Current finalize selections:", finalizeSelections);
  const preparedData = prepareFinalizeData();
  console.log("Prepared finalize data:", preparedData);
  
  // Manual check for required fields to provide better error messages
  if (eventData.event.customFields) {
    for (const [fieldId, field] of Object.entries(eventData.event.customFields)) {
      // Only check required fields
      if (field.required) {
        const fieldValue = preparedData.customFields?.[fieldId];
        
        // Log the field being checked for debugging
        console.log(`Checking required field "${field.title}" (${fieldId}):`, { 
          isRequired: field.required,
          type: field.type,
          hasValue: !!fieldValue,
          value: fieldValue
        });
        
        // Check if the required field has a value
        if (!fieldValue || 
            (typeof fieldValue === 'string' && fieldValue.trim() === '') || 
            (Array.isArray(fieldValue) && fieldValue.length === 0)) {
            
          // Provide a specific error message for the missing field
          const errorMessage = `Field "${field.title}" is required`;
          toast.error(errorMessage);
          console.error(errorMessage);
          return false;
        }
      }
    }
  }
  
  // Check date selection if date voting is present
  const dateCategory = eventData.chartsData.find(c => c.categoryName.toLowerCase() === 'date');
  if (dateCategory && dateCategory.options.length > 0) {
    const dateSelection = preparedData.date;
    if (!dateSelection) {
      const errorMessage = "Please select a date for the event";
      toast.error(errorMessage);
      console.error(errorMessage);
      return false;
    }
  }
  
  // Check place selection if place voting is present
  const placeCategory = eventData.chartsData.find(c => c.categoryName.toLowerCase() === 'place');
  if (placeCategory && placeCategory.options.length > 0) {
    const placeSelection = preparedData.place;
    if (!placeSelection) {
      const errorMessage = "Please select a location for the event";
      toast.error(errorMessage);
      console.error(errorMessage);
      return false;
    }
  }
  
  // Finally, use the Zod validation as a backup
  const validationResult = validateFinalizations(finalizeSelections, eventData.event);
  if (!validationResult.success) {
    console.error("Zod validation failed:", validationResult.message);
    toast.error(validationResult.message);
    return false;
  }
  
  // Check for empty optional fields and warn the user
  const { hasEmptyOptionals, emptyFields } = checkEmptyOptionalFields(finalizeSelections, eventData.event);
  if (hasEmptyOptionals) {
    // Show warning with empty fields, but don't block submission
    toast.warning(
      `Some optional fields have no selections: ${emptyFields.join(', ')}. You can continue or go back to make selections.`,
      { duration: 6000 }
    );
  }
  
  // All validations passed
  return true;
};

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    onClick: handleChartClick,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${value} ${value === 1 ? (activeTab === 'voting' ? 'vote' : 'response') : 
              (activeTab === 'voting' ? 'votes' : 'responses')}`;
          },
          footer: (tooltipItems: any) => {
            const index = tooltipItems[0].dataIndex;
            let rawOptions;
            
            if (activeTab === 'voting') {
              const chartData = getVotingChartData(activeCategory!);
              rawOptions = chartData?._rawOptions;
            } else if (activeTab === 'list') {
              const chartData = getListFieldChartData(activeListField!);
              rawOptions = chartData?._rawOptions;
            }
            
            if (rawOptions && index < rawOptions.length) {
              return 'Click to see voters';
            }
            return '';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any, index: number, values: any) {
            const label = this.getLabelForValue(index);
            // Truncate label if too long
            return label.length > 25 ? label.substring(0, 22) + '...' : label;
          }
        }
      },
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Component to display the list of voters for a selected option
  const VotersList = ({ option }: { option: {optionName: string, voterDetails: Voter[]} }) => {
    return (
      <div className="absolute top-4 right-4 w-72 bg-purple-900/80 border border-purple-700 rounded-lg shadow-lg p-4 z-10">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-purple-100">Voters for "{option.optionName}"</h4>
          <button 
            onClick={() => setSelectedOption(null)}
            className="text-purple-300 hover:text-purple-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {option.voterDetails.length === 0 ? (
            <p className="text-purple-300 italic">No voters</p>
          ) : (
            <ul className="space-y-2">
              {option.voterDetails.map((voter, idx) => (
                <li key={idx} className="bg-purple-800/40 p-2 rounded">
                  <div className="text-purple-100">{voter.email}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-md px-4 pt-16 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-purple-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-purple-100 mb-2">
              Loading Event Data
            </h2>
            <p className="text-purple-200">
              Please wait while we fetch the event details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !eventData) {
    return (
      <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-md px-4 pt-16 text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-purple-100 mb-2">
              Error Loading Event
            </h2>
            <p className="text-red-300 mb-8">
              {error?.message || "Failed to load event data"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (eventData.event.status === 'finalized') {
    if (isFinalizedLoading) {
      return (
        <div className="min-h-screen bg-purple-950">
          <Navbar />
          <div className="pt-20 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-md px-4 pt-16 text-center">
                  <Loader2 className="h-16 w-16 animate-spin text-purple-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-purple-100 mb-2">
                    Loading Finalized Event Details
                  </h2>
                  <p className="text-purple-200">
                    Please wait while we fetch the finalized event information...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isFinalizedError || !finalizedEventData) {
      return (
        <div className="min-h-screen bg-purple-950">
          <Navbar />
          <div className="pt-20 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-md px-4 pt-16 text-center">
                  <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-purple-100 mb-2">
                    Error Loading Finalized Event
                  </h2>
                  <p className="text-red-300 mb-8">
                    Failed to load finalized event details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Group custom fields
    const groupedFields = groupFieldsByType(finalizedEventData.finalizedEvent.customFieldSelections);

    return (
      <div className="min-h-screen bg-purple-950">
        <Navbar />
        <div className="pt-20 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Finalized Status Banner */}
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0" />
              <div>
                <h3 className="text-blue-200 font-medium">This event has been finalized</h3>
                <p className="text-blue-300 text-sm">
                  You have confirmed the final details for this event.
                </p>
              </div>
            </div>

            {/* Event Header */}
            <Card className="bg-purple-900/40 border-purple-700/50 mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl font-bold text-purple-100">
                      {finalizedEventData.event.name}
                    </CardTitle>
                    <CardDescription className="text-purple-200 mt-2 text-base">
                      {eventData.event.description}
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-600/30 text-blue-200">Finalized</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-purple-300 mb-3">
                  <UserCircle className="h-4 w-4" />
                  <span>Organized by: {finalizedEventData.organizer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-300">
                  <Clock className="h-4 w-4" />
                  <span>Finalized on: {formatDate(finalizedEventData.finalizedEvent.finalizedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Date and Place */}
              <Card className="bg-purple-900/40 border-purple-700/50">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-100 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-300" />
                    Confirmed Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-purple-800/40 p-4 rounded-md border border-purple-700/50">
                    <p className="text-purple-100 text-lg font-medium">
                      {formatDate(finalizedEventData.finalizedEvent.finalizedDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-900/40 border-purple-700/50">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-100 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-300" />
                    Confirmed Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-purple-800/40 p-4 rounded-md border border-purple-700/50">
                    <p className="text-purple-100 text-lg font-medium">
                      {finalizedEventData.finalizedEvent.finalizedPlace || 'No location specified'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Custom Fields */}
            {Object.entries(groupedFields).map(([fieldType, selections]) => {
              if (selections.length === 0) return null;
              
              return (
                <Card key={fieldType} className="bg-purple-900/40 border-purple-700/50 mt-6">
                  <CardHeader>
                    <CardTitle className="text-xl text-purple-100 flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-purple-300" />
                      {fieldType === 'text' ? 'Text Responses' : 
                       fieldType === 'radio' ? 'Selected Options' :
                       fieldType === 'checkbox' ? 'Selected Options' : 'List Entries'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {selections.map((selection, idx) => (
                        <div key={idx} className="bg-purple-800/30 p-4 rounded-lg border border-purple-700/50">
                          <h3 className="text-lg font-medium text-purple-100 mb-3">{selection.fieldTitle}</h3>
                          
                          {/* Text field */}
                          {selection.fieldType === 'text' && (
                            <p className="text-purple-200">{selection.selection}</p>
                          )}
                          
                          {/* Radio field (single selection) */}
                          {selection.fieldType === 'radio' && (
                            <div className="flex items-center gap-2 bg-purple-700/40 p-3 rounded">
                              <CheckCircle className="h-5 w-5 text-green-400" />
                              <span className="text-purple-100">{selection.selection}</span>
                            </div>
                          )}
                          
                          {/* Checkbox field (multiple selections) */}
                          {selection.fieldType === 'checkbox' && (
                            <div className="grid gap-2">
                              {Array.isArray(selection.selection) ? (
                                selection.selection.map((option, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2 bg-purple-700/40 p-3 rounded">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                    <span className="text-purple-100">{option}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-2 bg-purple-700/40 p-3 rounded">
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                  <span className="text-purple-100">{selection.selection}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* List field */}
                          {selection.fieldType === 'list' && (
                            <div className="space-y-2">
                              {Array.isArray(selection.selection) ? (
                                selection.selection.map((item, itemIdx) => (
                                  <div key={itemIdx} className="bg-purple-700/40 p-3 rounded">
                                    <p className="text-purple-100">{item}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="bg-purple-700/40 p-3 rounded">
                                  <p className="text-purple-100">{selection.selection}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Add to Calendar Section */}
            <Card className="bg-purple-900/40 border-purple-700/50 mt-6">
              <CardHeader>
                <CardTitle className="text-xl text-purple-100">Add to Your Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-purple-600 hover:bg-purple-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Google Calendar
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Outlook Calendar
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Apple Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Contact Info Section */}
            <div className="bg-purple-800/30 rounded-lg p-4 mt-6 flex items-start gap-3 border border-purple-700/50">
              <AlertCircle className="h-5 w-5 text-purple-300 mt-0.5" />
              <div>
                <p className="text-purple-200">
                  This event has been finalized. If you need to make changes, please contact the organizer at{" "}
                  <span className="text-purple-100">{finalizedEventData.organizer.email}</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // No responses yet
  const hasNoResponses = eventData.responses.length === 0;

  // Check if there are list fields or text fields with responses
  const hasListFieldResponses = eventData.listFieldsData && eventData.listFieldsData.length > 0;
  const hasTextFieldResponses = eventData.textFieldsData && eventData.textFieldsData.length > 0;

  // Extract date and place options for the EventStatusManagement component
  const dateCategory = eventData.chartsData.find(c => c.categoryName.toLowerCase() === "date");
  const placeCategory = eventData.chartsData.find(c => c.categoryName.toLowerCase() === "place");

  return (
    <div className="min-h-screen bg-purple-950">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Event Header */}
          <div className="bg-purple-900/40 rounded-xl p-6 border border-purple-700/50 mb-6">
            <h1 className="text-3xl font-bold text-purple-100 mb-2">
              {eventData.event.name}
            </h1>
            <p className="text-purple-200 mb-4">
              {eventData.event.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-purple-300">
              <Badge className="bg-blue-600/30 text-blue-200">
                {eventData.responses.length} {eventData.responses.length === 1 ? 'Response' : 'Responses'}
              </Badge>
              <Badge className={`${eventData.event.status === 'open' ? 'bg-green-600/30 text-green-200' : 
                eventData.event.status === 'closed' ? 'bg-yellow-600/30 text-yellow-200' : 
                'bg-red-600/30 text-red-200'}`}>
                Status: {eventData.event.status.charAt(0).toUpperCase() + eventData.event.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Event Status Management Component */}
          <EventStatusManagement 
            event={eventData.event}
            dateOptions={dateCategory?.options}
            placeOptions={placeCategory?.options}
            finalizeData={prepareFinalizeData()}
            validateSelections={validateFinalizeSelections}
          />

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex border-b border-purple-700/50">
              {/* Dashboard Tab */}
              <button
                className={`px-4 py-2 text-lg font-medium ${
                  activeTab === 'dashboard'
                    ? 'text-purple-100 border-b-2 border-purple-400'
                    : 'text-purple-300 hover:text-purple-200'
                }`}
                onClick={() => {
                  setActiveTab('dashboard');
                  setSelectedOption(null);
                }}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </div>
              </button>
              <button
                className={`px-4 py-2 text-lg font-medium ${
                  activeTab === 'voting'
                    ? 'text-purple-100 border-b-2 border-purple-400'
                    : 'text-purple-300 hover:text-purple-200'
                }`}
                onClick={() => {
                  setActiveTab('voting');
                  setSelectedOption(null);
                }}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Voting Results
                </div>
              </button>
              <button
                className={`px-4 py-2 text-lg font-medium ${
                  activeTab === 'list'
                    ? 'text-purple-100 border-b-2 border-purple-400'
                    : 'text-purple-300 hover:text-purple-200'
                }`}
                onClick={() => {
                  setActiveTab('list');
                  setSelectedOption(null);
                }}
                disabled={!hasListFieldResponses}
              >
                <div className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  List Field Responses
                </div>
              </button>
              {/* Text Field Responses Tab */}
              <button
                className={`px-4 py-2 text-lg font-medium ${
                  activeTab === 'text'
                    ? 'text-purple-100 border-b-2 border-purple-400'
                    : 'text-purple-300 hover:text-purple-200'
                }`}
                onClick={() => {
                  setActiveTab('text');
                  setSelectedOption(null);
                }}
                disabled={!hasTextFieldResponses}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Text Field Responses
                </div>
              </button>
            </div>
          </div>

          {hasNoResponses ? (
            <div className="bg-purple-900/40 rounded-xl p-8 border border-purple-700/50 text-center">
              <Users className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <h2 className="text-2xl font-medium text-purple-100 mb-2">No Responses Yet</h2>
              <p className="text-purple-200 max-w-md mx-auto">
                Your event hasn't received any responses yet. Share the event link with participants to start collecting responses.
              </p>
            </div>
          ) : (
            // Show dashboard or other tabs based on active tab
            <div className="bg-purple-900/40 rounded-xl border border-purple-700/50">
              {activeTab === 'dashboard' ? (
                // Dashboard View with EventVisualization component
                <div>
                  <div className="p-6 border-b border-purple-700/50">
                    <h2 className="text-2xl font-semibold text-purple-100">
                      Event Dashboard
                    </h2>
                    <p className="text-purple-300 text-sm mt-1">
                      Overview of all voting categories and responses. Select options to finalize the event.
                    </p>
                  </div>
                  <div className="p-6">
                    <EventVisualization 
                      eventData={{
                        event: eventData.event,
                        chartsData: eventData.chartsData,
                        listFieldsData: eventData.listFieldsData,
                        textFieldsData: eventData.textFieldsData
                      }}
                      onSelectionChange={handleSelectionChange}
                    />
                  </div>
                </div>
              ) : activeTab === 'voting' ? (
                // Voting Categories Section
                <div>
                  <div className="p-6 border-b border-purple-700/50">
                    <h2 className="text-2xl font-semibold text-purple-100">
                      Voting Results
                    </h2>
                    <p className="text-purple-300 text-sm mt-1">
                      Click on a bar to see who voted for that option
                    </p>
                  </div>
                  <div className="grid md:grid-cols-4 gap-0">
                    {/* Category Tabs */}
                    <div className="p-4 border-r border-purple-700/50">
                      <h3 className="text-md font-medium text-purple-200 mb-4">Categories</h3>
                      <div className="space-y-2">
                        {eventData.chartsData.map((category) => (
                          <button
                            key={category.categoryName}
                            onClick={() => {
                              setActiveCategory(category.categoryName);
                              setSelectedOption(null);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-lg transition ${
                              activeCategory === category.categoryName
                                ? "bg-purple-700/50 text-purple-100"
                                : "hover:bg-purple-800/30 text-purple-300"
                            }`}
                          >
                            {category.categoryName}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chart Display */}
                    <div className="p-6 md:col-span-3 relative">
                      {activeCategory && (
                        <>
                          <h3 className="text-xl font-medium text-purple-100 mb-4">
                            {activeCategory} Voting Results
                          </h3>
                          <div className="h-96 w-full">
                            {getVotingChartData(activeCategory) && (
                              <Bar 
                                data={getVotingChartData(activeCategory)!} 
                                options={chartOptions} 
                              />
                            )}
                          </div>
                          
                          {/* Display voters when a bar is clicked */}
                          {selectedOption && <VotersList option={selectedOption} />}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : activeTab === 'list' ? (
                // List Field Responses Section
                <div>
                  <div className="p-6 border-b border-purple-700/50">
                    <h2 className="text-2xl font-semibold text-purple-100">
                      List Field Responses
                    </h2>
                    <p className="text-purple-300 text-sm mt-1">
                      Click on a bar to see who provided that response
                    </p>
                  </div>
                  <div className="grid md:grid-cols-4 gap-0">
                    {/* Field Tabs */}
                    <div className="p-4 border-r border-purple-700/50">
                      <h3 className="text-md font-medium text-purple-200 mb-4">List Fields</h3>
                      {hasListFieldResponses ? (
                        <div className="space-y-2">
                          {eventData.listFieldsData.map((field) => (
                            <button
                              key={field.fieldId}
                              onClick={() => {
                                setActiveListField(field.fieldId);
                                setSelectedOption(null);
                              }}
                              className={`w-full text-left px-4 py-2 rounded-lg transition ${
                                activeListField === field.fieldId
                                  ? "bg-purple-700/50 text-purple-100"
                                  : "hover:bg-purple-800/30 text-purple-300"
                              }`}
                            >
                              {field.categoryName}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-purple-300 italic">No list fields found</p>
                      )}
                    </div>

                    {/* Chart Display */}
                    <div className="p-6 md:col-span-3 relative">
                      {activeListField && hasListFieldResponses ? (
                        <>
                          <h3 className="text-xl font-medium text-purple-100 mb-4">
                            {eventData.listFieldsData.find(f => f.fieldId === activeListField)?.categoryName} Responses
                          </h3>
                          <div className="h-96 w-full">
                            {getListFieldChartData(activeListField) && (
                              <Bar 
                                data={getListFieldChartData(activeListField)!} 
                                options={chartOptions} 
                              />
                            )}
                          </div>
                          
                          {/* Display responders when a bar is clicked */}
                          {selectedOption && <VotersList option={selectedOption} />}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-purple-300">Select a list field to view responses</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Text Field Responses Section
                <div>
                  <div className="p-6 border-b border-purple-700/50">
                    <h2 className="text-2xl font-semibold text-purple-100">
                      Text Field Responses
                    </h2>
                    <p className="text-purple-300 text-sm mt-1">
                      View individual text responses from participants
                    </p>
                  </div>
                  <div className="grid md:grid-cols-4 gap-0">
                    {/* Field Tabs */}
                    <div className="p-4 border-r border-purple-700/50">
                      <h3 className="text-md font-medium text-purple-200 mb-4">Text Fields</h3>
                      {hasTextFieldResponses ? (
                        <div className="space-y-2">
                          {eventData.textFieldsData.map((field) => (
                            <button
                              key={field.fieldId}
                              onClick={() => {
                                setActiveTextField(field.fieldId);
                              }}
                              className={`w-full text-left px-4 py-2 rounded-lg transition ${
                                activeTextField === field.fieldId
                                  ? "bg-purple-700/50 text-purple-100"
                                  : "hover:bg-purple-800/30 text-purple-300"
                              }`}
                            >
                              {field.categoryName}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-purple-300 italic">No text fields with responses</p>
                      )}
                    </div>

                    {/* Text Field Response Display */}
                    <div className="p-6 md:col-span-3">
                      {activeTextField && hasTextFieldResponses ? (
                        <>
                          {getTextFieldData(activeTextField) && (
                            <div className="space-y-4">
                              <h3 className="text-xl font-medium text-purple-100 mb-4">
                                {getTextFieldData(activeTextField)?.categoryName} Responses
                              </h3>
                              {getTextFieldData(activeTextField)?.responses.length === 0 ? (
                                <p className="text-purple-300 italic">No responses yet</p>
                              ) : (
                                <div className="space-y-4">
                                  {getTextFieldData(activeTextField)?.responses.map((response, idx) => (
                                    <div key={idx} className="bg-purple-800/40 p-4 rounded-lg border border-purple-700/50">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <Badge className="bg-purple-600">{response.userEmail}</Badge>
                                        {response.userName && <span className="text-purple-200">({response.userName})</span>}
                                      </div>
                                      <p className="text-purple-100">{response.response}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-purple-300">Select a text field to view responses</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventEdit;