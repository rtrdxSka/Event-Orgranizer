import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEvent } from '@/lib/api';
import { Loader2, XCircle, Info, AlignLeft, Calendar, Plus, Check, ThumbsUp } from 'lucide-react';
import Navbar from '@/components/NavBar';


const EventSubmit = () => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState<string>("");
  const [suggestedDates, setSuggestedDates] = useState<string[]>([]);
  // Get the eventUUID from the URL params
  const { eventUUID } = useParams<{ eventUUID: string }>();
  
  // Fetch event data
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventUUID],
    queryFn: async () => {
      const response = await getEvent(eventUUID || '');
      return response.event; // Extract the event directly
    },
    enabled: !!eventUUID, // Only run the query if eventUUID exists
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-purple-950/80" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-md px-4 pt-16 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-purple-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-purple-100 mb-2">
              Loading Event
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
  if (error || !event) {
    return (
      <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-purple-950/80" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-md px-4 pt-16 text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-purple-100 mb-2">
              Event Not Found
            </h2>
            <p className="text-red-300 mb-8">
              {error instanceof Error ? error.message : "Unable to find this event. It may have been removed or the link is incorrect."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Extract event data
  console.log("Event data:", event); // Log to see the structure for debugging

  return (
    <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-purple-900/40 rounded-xl p-8 border border-purple-700/50">
            <h1 className="text-3xl font-bold text-purple-100 mb-6 text-center">
              Event Details
            </h1>
            
            {/* Event information with clear field labels */}
            <div className="space-y-6">
              {/* Event Name Field */}
              <div className="bg-purple-800/30 rounded-lg p-6">
                <div className="flex items-center mb-2">
                  <Info className="h-5 w-5 text-purple-300 mr-2" />
                  <h2 className="text-xl font-semibold text-purple-100">Event Name</h2>
                </div>
                <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                  <p className="text-purple-100 text-lg font-medium">
                    {event.name}
                  </p>
                </div>
              </div>
              
              {/* Event Description Field */}
              <div className="bg-purple-800/30 rounded-lg p-6">
                <div className="flex items-center mb-2">
                  <AlignLeft className="h-5 w-5 text-purple-300 mr-2" />
                  <h2 className="text-xl font-semibold text-purple-100">Event Description</h2>
                </div>
                <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                  <p className="text-purple-200 whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
              
              {/* Event Code */}
              <div className="bg-purple-800/30 rounded-lg p-6">
                <div className="flex items-center mb-2">
                  <Info className="h-5 w-5 text-purple-300 mr-2" />
                  <h2 className="text-xl font-semibold text-purple-100">Event Code</h2>
                </div>
                <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                  <p className="text-purple-100 text-lg font-medium">
                    {event.eventUUID}
                  </p>
                </div>
              </div>
                          
              {/* Event Dates Field */}
              {event.eventDates && (
                <div className="bg-purple-800/30 rounded-lg px-6 py-3">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-purple-300 mr-2" />
                    <h2 className="text-xl font-semibold text-purple-100">Event Dates</h2>
                  </div>
                  <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                    {/* Display existing dates */}
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-purple-200 mb-2">Available Dates</h3>
                      {event.eventDates.dates.length > 0 || suggestedDates.length > 0 ? (
                        <div className="space-y-2">
                          {event.eventDates.dates.map((dateStr, index) => {
                            const date = new Date(dateStr);
                            const formattedDate = date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                            const isVoted = selectedDates.includes(dateStr);
                            
                            return (
                              <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-purple-800/40 rounded">
                                <span className="text-purple-100">{formattedDate}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isVoted) {
                                      setSelectedDates(selectedDates.filter(d => d !== dateStr));
                                    } else if (selectedDates.length < event.eventDates.maxVotes) {
                                      setSelectedDates([...selectedDates, dateStr]);
                                    } else {
                                      alert(`You can only vote for ${event.eventDates.maxVotes} dates maximum.`);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded flex items-center ${
                                    isVoted 
                                      ? 'bg-purple-500 text-white' 
                                      : 'bg-purple-900 text-purple-300 hover:bg-purple-800'
                                  }`}
                                >
                                  {isVoted ? (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Voted
                                    </>
                                  ) : (
                                    <>
                                      <ThumbsUp className="h-4 w-4 mr-1" />
                                      Vote
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                          
                          {/* Display user-suggested dates */}
                          {suggestedDates.map((dateStr, index) => {
                            const date = new Date(dateStr);
                            const formattedDate = date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                            const isVoted = selectedDates.includes(dateStr);
                            
                            return (
                              <div key={`suggested-${index}`} className="flex items-center justify-between p-2 bg-purple-700/40 rounded border border-purple-500/30">
                                <div className="flex items-center">
                                  <span className="text-purple-100">{formattedDate}</span>
                                  <span className="ml-2 px-2 py-0.5 bg-purple-600/50 text-purple-200 rounded text-xs">Your suggestion</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isVoted) {
                                        setSelectedDates(selectedDates.filter(d => d !== dateStr));
                                      } else if (selectedDates.length < event.eventDates.maxVotes) {
                                        setSelectedDates([...selectedDates, dateStr]);
                                      } else {
                                        alert(`You can only vote for ${event.eventDates.maxVotes} dates maximum.`);
                                      }
                                    }}
                                    className={`px-3 py-1 rounded flex items-center ${
                                      isVoted 
                                        ? 'bg-purple-500 text-white' 
                                        : 'bg-purple-900 text-purple-300 hover:bg-purple-800'
                                    }`}
                                  >
                                    {isVoted ? (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Voted
                                      </>
                                    ) : (
                                      <>
                                        <ThumbsUp className="h-4 w-4 mr-1" />
                                        Vote
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Remove this date from suggestions
                                      setSuggestedDates(suggestedDates.filter(d => d !== dateStr));
                                      // Also remove any votes for this date
                                      if (isVoted) {
                                        setSelectedDates(selectedDates.filter(d => d !== dateStr));
                                      }
                                    }}
                                    className="p-1 rounded bg-red-900/30 text-red-300 hover:bg-red-900/50"
                                    title="Remove suggestion"
                                  >
                                    &times;
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-purple-300 italic">No dates have been specified for this event.</p>
                      )}
                    </div>
                    
                    {/* Add new date section */}
                    {event.eventDates.allowUserAdd && (
                      <div className="mt-4 pt-4 border-t border-purple-600/30">
                        <h3 className="text-lg font-medium text-purple-200 mb-2">Suggest New Date</h3>
                        <p className="text-purple-300 text-sm mb-2">
                          {event.eventDates.maxDates > 0 
                            ? `You can suggest up to ${event.eventDates.maxDates} dates.` 
                            : "You can suggest additional dates for this event."}
                        </p>
                        
                        {(event.eventDates.maxDates === 0 || event.eventDates.dates.length + suggestedDates.length < event.eventDates.maxDates) && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="date"
                              value={newDate}
                              onChange={(e) => setNewDate(e.target.value)}
                              className="flex-1 bg-purple-900/40 border border-purple-600 rounded p-2 text-purple-100"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newDate) {
                                  // Add the new date to the suggested dates array
                                  const dateObj = new Date(newDate);
                                  const dateStr = dateObj.toISOString();
                                  
                                  // Check if date already exists
                                  const allDates = [...event.eventDates.dates, ...suggestedDates];
                                  const dateExists = allDates.some(d => {
                                    const existingDate = new Date(d);
                                    return existingDate.toDateString() === dateObj.toDateString();
                                  });
                                  
                                  if (dateExists) {
                                    alert("This date has already been suggested.");
                                  } else {
                                    setSuggestedDates([...suggestedDates, dateStr]);
                                    // Here you would also handle the API call to add the date
                                    console.log("Adding new date:", dateStr);
                                    setNewDate("");
                                  }
                                }
                              }}
                              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded flex items-center"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </button>
                          </div>
                        )}
                        
                        {event.eventDates.maxDates > 0 && event.eventDates.dates.length + suggestedDates.length >= event.eventDates.maxDates && (
                          <p className="text-yellow-300">
                            Maximum number of dates ({event.eventDates.maxDates}) has been reached.
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Voting information */}
                    <div className="mt-4 bg-purple-800/30 p-3 rounded">
                      <p className="text-purple-300 text-sm">
                        You have selected {selectedDates.length} of {event.eventDates.maxVotes} possible votes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Submit button */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className="bg-purple-500 hover:bg-purple-400 text-white font-medium px-6 py-3 rounded-lg"
                onClick={() => {
                  console.log("Submitting selections:", { 
                    selectedDates,
                    suggestedDates 
                  });
                  alert("Selections would be submitted to the server");
                }}
              >
                Submit Responses
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSubmit;