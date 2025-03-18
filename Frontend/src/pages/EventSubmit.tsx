import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEvent } from '@/lib/api';
import { Loader2, XCircle, Info, AlignLeft, Calendar, Plus, Check, ThumbsUp } from 'lucide-react';
import Navbar from '@/components/NavBar';



const EventSubmit = () => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  // Initialize newDate with current date and default time
  const [newDate, setNewDate] = useState<string>(() => {
    const now = new Date();
    return `${now.toISOString().split('T')[0]}T12:00`;
  });
  const [suggestedDates, setSuggestedDates] = useState<string[]>([]);
  
  // Get the eventUUID from the URL params
  const { eventUUID } = useParams<{ eventUUID: string }>();
  
  // Fetch event data with react-query (one-time fetch)
  const { 
    data: event, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['event', eventUUID],
    queryFn: () => getEvent(eventUUID || ''),
    enabled: !!eventUUID,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    staleTime: Infinity
  });

  // Handle adding a new date suggestion
  const handleAddDate = () => {
    if (!newDate || !event?.eventDates) return;
    
    // Ensure we have both date and time
    const [datePart, timePart] = newDate.split('T');
    if (!datePart || !timePart) {
      alert("Please select both date and time");
      return;
    }
    
    // Create a proper date object with the date and time
    const dateObj = new Date(`${datePart}T${timePart}:00`);
    const dateStr = dateObj.toISOString();
    
    // Check if date already exists
    const allDates = [...(event.eventDates.dates || []), ...suggestedDates];
    const dateExists = allDates.some(d => {
      const existingDate = new Date(d);
      // Compare both date and time (within 1 minute tolerance)
      return Math.abs(existingDate.getTime() - dateObj.getTime()) < 60000;
    });
    
    if (dateExists) {
      alert("This date and time has already been suggested.");
      return;
    }
    
    setSuggestedDates([...suggestedDates, dateStr]);

  };

  // Handle date voting
  const handleDateVote = (dateStr: string, isVoted: boolean) => {
    if (!event?.eventDates?.maxVotes) return;
    
    if (isVoted) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else if (selectedDates.length < event.eventDates.maxVotes) {
      setSelectedDates([...selectedDates, dateStr]);
    } else {
      alert(`You can only vote for ${event.eventDates.maxVotes} dates maximum.`);
    }
  };

  // Handle removing a suggested date
  const handleRemoveSuggestedDate = (dateStr: string) => {
    setSuggestedDates(suggestedDates.filter(d => d !== dateStr));
    
    // Also remove any votes for this date
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    console.log("Submitting selections:", { 
      selectedDates,
      suggestedDates 
    });
    alert("Your selections have been submitted.");
  };

  // Format date for display, including time
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    // Format the date part
    const dateFormatted = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format the time part
    const timeFormatted = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateFormatted} at ${timeFormatted}`;
  };

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

  // Calculate if we can add more dates
  const canAddMoreDates = !event.eventDates?.maxDates || 
    event.eventDates.dates.length + suggestedDates.length < event.eventDates.maxDates;

  return (
    <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-purple-900/40 rounded-xl p-8 border border-purple-700/50">
            <h1 className="text-3xl font-bold text-purple-100 mb-6 text-center">
              Event Details
            </h1>
            
            {/* Event information fields */}
            <div className="space-y-6">
              {/* Event Name Field */}
              <div className="bg-purple-800/30 rounded-lg p-6">
                <div className="flex items-center mb-2">
                  <Info className="h-5 w-5 text-purple-300 mr-2" />
                  <h2 className="text-xl font-semibold text-purple-100">Event Name</h2>
                </div>
                <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                  <p className="text-purple-100 text-lg font-medium">{event.name}</p>
                </div>
              </div>
              
              {/* Event Description Field */}
              <div className="bg-purple-800/30 rounded-lg p-6">
                <div className="flex items-center mb-2">
                  <AlignLeft className="h-5 w-5 text-purple-300 mr-2" />
                  <h2 className="text-xl font-semibold text-purple-100">Event Description</h2>
                </div>
                <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                  <p className="text-purple-200 whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
              
              {/* Event Dates Field */}
              {event.eventDates && (
                <div className="bg-purple-800/30 rounded-lg p-6">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-purple-300 mr-2" />
                    <h2 className="text-xl font-semibold text-purple-100">Event Dates</h2>
                  </div>
                  <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                    {/* Available dates section */}
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-purple-200 mb-2">Available Dates</h3>
                      {event.eventDates.dates.length > 0 || suggestedDates.length > 0 ? (
                        <div className="space-y-2">
                          {/* Existing dates from the event */}
                          {event.eventDates.dates.map((dateStr, index) => {
                            const isVoted = selectedDates.includes(dateStr);
                            
                            return (
                              <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-purple-800/40 rounded">
                                <span className="text-purple-100">{formatDate(dateStr)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDateVote(dateStr, isVoted)}
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
                          
                          {/* User-suggested dates */}
                          {suggestedDates.map((dateStr, index) => {
                            const isVoted = selectedDates.includes(dateStr);
                            
                            return (
                              <div key={`suggested-${index}`} className="flex items-center justify-between p-2 bg-purple-700/40 rounded border border-purple-500/30">
                                <div className="flex items-center">
                                  <span className="text-purple-100">{formatDate(dateStr)}</span>
                                  <span className="ml-2 px-2 py-0.5 bg-purple-600/50 text-purple-200 rounded text-xs">Your suggestion</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDateVote(dateStr, isVoted)}
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
                                    onClick={() => handleRemoveSuggestedDate(dateStr)}
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
                        
                        {canAddMoreDates && (
                            <div className="flex items-center space-x-2 w-full">
                              <input
                                type="date"
                                value={newDate.split('T')[0]}
                                onChange={(e) => setNewDate(`${e.target.value}T${newDate.split('T')[1] || '12:00'}`)}
                                className="flex-1 bg-purple-900/40 border border-purple-600 rounded p-2 text-purple-100"
                              />
                              <input
                                type="time"
                                value={newDate.split('T')[1] || '12:00'}
                                onChange={(e) => setNewDate(`${newDate.split('T')[0] || new Date().toISOString().split('T')[0]}T${e.target.value}`)}
                                className="w-32 bg-purple-900/40 border border-purple-600 rounded p-2 text-purple-100"
                              />
                              <button
                                type="button"
                                onClick={handleAddDate}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded flex items-center"
                                disabled={!newDate.includes('T')}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </button>
                            </div>
                        )}
                        
                        {!canAddMoreDates && event.eventDates.maxDates > 0 && (
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
                onClick={handleSubmit}
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