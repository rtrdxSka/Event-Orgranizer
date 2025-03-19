import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEvent } from '@/lib/api';
import { Loader2, XCircle, Info, AlignLeft, Calendar, MapPin, Plus, Check, ThumbsUp } from 'lucide-react';
import Navbar from '@/components/NavBar';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Define the form schema with Zod
const eventSubmitSchema = z.object({
  selectedDates: z.array(z.string()),
  newDate: z.string().optional(),
  selectedPlaces: z.array(z.string()),
  newPlace: z.string().optional(),
});

type EventSubmitFormData = z.infer<typeof eventSubmitSchema>;

const EventSubmit = () => {
  // Get the eventUUID from the URL params
  const { eventUUID } = useParams<{ eventUUID: string }>();
  const [suggestedDates, setSuggestedDates] = useState<string[]>([]);

  // State for suggested places (outside the form)
  const [suggestedPlaces, setSuggestedPlaces] = useState<string[]>([]);

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventSubmitFormData>({
    resolver: zodResolver(eventSubmitSchema),
    defaultValues: {
      selectedDates: [],
      newDate: new Date().toISOString().split('T')[0] + 'T12:00',
      selectedPlaces: [],
      newPlace: '',
    },
  });

  // Watch form values
  const selectedDates = watch('selectedDates');
  const newDate = watch('newDate');
  const selectedPlaces = watch('selectedPlaces');
  const newPlace = watch('newPlace');
  
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

  useEffect(() => {
    console.log("Event data updated:", event);
  }, [event]);

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
    console.log(`Vote clicked for ${dateStr}, current status: ${isVoted}`);
    if (!event?.eventDates?.maxVotes) return;
    
    if (isVoted) {
      setValue('selectedDates', selectedDates.filter(d => d !== dateStr));
    } else if (selectedDates.length < event.eventDates.maxVotes) {
      setValue('selectedDates', [...selectedDates, dateStr]);
    } else {
      alert(`You can only vote for ${event.eventDates.maxVotes} dates maximum.`);
    }
  };

  // Handle removing a suggested date
  const handleRemoveSuggestedDate = (dateStr: string) => {
    setSuggestedDates(suggestedDates.filter(d => d !== dateStr));
    
    // Also remove any votes for this date
    if (selectedDates.includes(dateStr)) {
      setValue('selectedDates', selectedDates.filter(d => d !== dateStr));
    }
  };
  
  // Handle adding a new place suggestion
  const handleAddPlace = () => {
    if (!newPlace || !event?.eventPlaces) return;
    
    // Check if place already exists
    const allPlaces = [...(event.eventPlaces.places || []), ...suggestedPlaces];
    const placeExists = allPlaces.some(p => 
      p.toLowerCase().trim() === newPlace.toLowerCase().trim()
    );
    
    if (placeExists) {
      alert("This place has already been suggested.");
      return;
    }
    
    setSuggestedPlaces([...suggestedPlaces, newPlace.trim()]);
    setValue('newPlace', ''); // Clear the input field
  };

  // Handle place voting
  const handlePlaceVote = (place: string, isVoted: boolean) => {
    console.log(`Vote clicked for place: ${place}, current status: ${isVoted}`);
    if (!event?.eventPlaces?.maxVotes) return;
    
    if (isVoted) {
      setValue('selectedPlaces', selectedPlaces.filter(p => p !== place));
    } else if (selectedPlaces.length < event.eventPlaces.maxVotes) {
      setValue('selectedPlaces', [...selectedPlaces, place]);
    } else {
      alert(`You can only vote for ${event.eventPlaces.maxVotes} places maximum.`);
    }
  };

  // Handle removing a suggested place
  const handleRemoveSuggestedPlace = (place: string) => {
    setSuggestedPlaces(suggestedPlaces.filter(p => p !== place));
    
    // Also remove any votes for this place
    if (selectedPlaces.includes(place)) {
      setValue('selectedPlaces', selectedPlaces.filter(p => p !== place));
    }
  };

  // Handle form submission
  const onSubmit = (data: EventSubmitFormData) => {
    console.log("Submitting selections:", { 
      selectedDates: data.selectedDates,
      suggestedDates,
      selectedPlaces: data.selectedPlaces,
      suggestedPlaces
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
    
  // Calculate if we can add more places
  const canAddMorePlaces = !event.eventPlaces?.maxPlaces || 
    event.eventPlaces.places.length + suggestedPlaces.length < event.eventPlaces.maxPlaces;

  return (
    <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-purple-900/40 rounded-xl p-8 border border-purple-700/50">
            <h1 className="text-3xl font-bold text-purple-100 mb-6 text-center">
              Event Details
            </h1>
            
            <form onSubmit={handleSubmit(onSubmit)}>
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
                              <Controller
                                name="newDate"
                                control={control}
                                render={({ field }) => (
                                  <>
                                    <Input
                                      type="date"
                                      value={field.value?.split('T')[0] || ''}
                                      onChange={(e) => {
                                        const timePart = field.value?.split('T')[1] || '12:00';
                                        field.onChange(`${e.target.value}T${timePart}`);
                                      }}
                                      className="flex-1 bg-purple-900/40 border border-purple-600 rounded p-2 text-purple-100"
                                    />
                                    <Input
                                      type="time"
                                      value={field.value?.split('T')[1] || '12:00'}
                                      onChange={(e) => {
                                        const datePart = field.value?.split('T')[0] || new Date().toISOString().split('T')[0];
                                        field.onChange(`${datePart}T${e.target.value}`);
                                      }}
                                      className="w-32 bg-purple-900/40 border border-purple-600 rounded p-2 text-purple-100"
                                    />
                                  </>
                                )}
                              />
                              <Button
                                type="button"
                                onClick={handleAddDate}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded flex items-center"
                                disabled={!newDate?.includes('T')}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
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
                          You have selected {selectedDates.length} of {event.eventDates.maxVotes || 0} possible votes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Event Places Field */}
                {event.eventPlaces && (
                  <div className="bg-purple-800/30 rounded-lg p-6">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-5 w-5 text-purple-300 mr-2" />
                      <h2 className="text-xl font-semibold text-purple-100">Event Places</h2>
                    </div>
                    <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                      {/* Available places section */}
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-purple-200 mb-2">Available Places</h3>
                        {event.eventPlaces.places.length > 0 || suggestedPlaces.length > 0 ? (
                          <div className="space-y-2">
                            {/* Existing places from the event */}
                            {event.eventPlaces.places.map((place, index) => {
                              const isVoted = selectedPlaces.includes(place);
                              
                              return (
                                <div key={`existing-place-${index}`} className="flex items-center justify-between p-2 bg-purple-800/40 rounded">
                                  <span className="text-purple-100">{place}</span>
                                  <button
                                    type="button"
                                    onClick={() => handlePlaceVote(place, isVoted)}
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
                            
                            {/* User-suggested places */}
                            {suggestedPlaces.map((place, index) => {
                              const isVoted = selectedPlaces.includes(place);
                              
                              return (
                                <div key={`suggested-place-${index}`} className="flex items-center justify-between p-2 bg-purple-700/40 rounded border border-purple-500/30">
                                  <div className="flex items-center">
                                    <span className="text-purple-100">{place}</span>
                                    <span className="ml-2 px-2 py-0.5 bg-purple-600/50 text-purple-200 rounded text-xs">Your suggestion</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => handlePlaceVote(place, isVoted)}
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
                                      onClick={() => handleRemoveSuggestedPlace(place)}
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
                          <p className="text-purple-300 italic">No places have been specified for this event.</p>
                        )}
                      </div>
                      
                      {/* Add new place section */}
                      {event.eventPlaces.allowUserAdd && (
                        <div className="mt-4 pt-4 border-t border-purple-600/30">
                          <h3 className="text-lg font-medium text-purple-200 mb-2">Suggest New Place</h3>
                          <p className="text-purple-300 text-sm mb-2">
                            {event.eventPlaces.maxPlaces > 0 
                              ? `You can suggest up to ${event.eventPlaces.maxPlaces} places.` 
                              : "You can suggest additional places for this event."}
                          </p>
                          
                          {canAddMorePlaces && (
                            <div className="flex items-center space-x-2 w-full">
                              <Controller
                                name="newPlace"
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter a place or location"
                                    className="flex-1 bg-purple-900/40 border border-purple-600 rounded p-2 text-purple-100"
                                  />
                                )}
                              />
                              <Button
                                type="button"
                                onClick={handleAddPlace}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded flex items-center"
                                disabled={!newPlace?.trim()}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          )}
                          
                          {!canAddMorePlaces && event.eventPlaces.maxPlaces > 0 && (
                            <p className="text-yellow-300">
                              Maximum number of places ({event.eventPlaces.maxPlaces}) has been reached.
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Voting information */}
                      <div className="mt-4 bg-purple-800/30 p-3 rounded">
                        <p className="text-purple-300 text-sm">
                          You have selected {selectedPlaces.length} of {event.eventPlaces.maxVotes || 0} possible votes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submit button */}
              <div className="mt-8 flex justify-center">
                <Button
                  type="submit"
                  className="bg-purple-500 hover:bg-purple-400 text-white font-medium px-6 py-3 rounded-lg"
                >
                  Submit Responses
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSubmit;