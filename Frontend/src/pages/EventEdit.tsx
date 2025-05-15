import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Navbar from '@/components/NavBar';
import { Loader2, XCircle, Users, List, X, MessageSquare } from 'lucide-react';
import { getEventForOwner } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

interface ChartOptionData {
  optionName: string;
  voteCount: number;
  voters: Voter[];
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

// New interface for text field responses
interface TextFieldResponseData {
  fieldId: string;
  categoryName: string;
  responses: Array<{
    userId: string;
    userEmail: string;
    userName?: string;
    response: string;
  }>;
}

interface EventOwnerData {
  event: any;
  responses: any[];
  chartsData: CategoryChartData[];
  listFieldsData: ListFieldChartData[];
  textFieldsData: TextFieldResponseData[]; // Added text fields data
}

const EventEdit = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState<'voting' | 'list' | 'text'>('voting');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeListField, setActiveListField] = useState<string | null>(null);
  const [activeTextField, setActiveTextField] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<{optionName: string, voterDetails: Voter[]} | null>(null);

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
    } else {
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
            } else {
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

  // Component to display text field responses
  const TextFieldResponses = ({ field }: { field: TextFieldResponseData }) => {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-medium text-purple-100 mb-4">
          {field.categoryName} Responses
        </h3>
        {field.responses.length === 0 ? (
          <p className="text-purple-300 italic">No responses yet</p>
        ) : (
          <div className="space-y-4">
            {field.responses.map((response, idx) => (
              <Card key={idx} className="bg-purple-800/40 border-purple-700/50">
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-purple-600">{response.userEmail}</Badge>
                      {response.userName && <span className="text-purple-200">({response.userName})</span>}
                    </div>
                    <p className="text-purple-100">{response.response}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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

  // No responses yet
  const hasNoResponses = eventData.responses.length === 0;

  // Check if there are text fields with responses
  const hasTextFieldResponses = eventData.textFieldsData && eventData.textFieldsData.length > 0;

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

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex border-b border-purple-700/50">
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
                disabled={!eventData.listFieldsData || eventData.listFieldsData.length === 0}
              >
                <div className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  List Field Responses
                </div>
              </button>
              {/* New tab for Text Field Responses */}
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
            // Show voting results, list field responses, or text field responses based on active tab
            <div className="bg-purple-900/40 rounded-xl border border-purple-700/50">
              {activeTab === 'voting' ? (
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
                      {eventData.listFieldsData && eventData.listFieldsData.length > 0 ? (
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
                      {activeListField && eventData.listFieldsData && eventData.listFieldsData.length > 0 ? (
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
                            <TextFieldResponses 
                              field={getTextFieldData(activeTextField)!} 
                            />
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