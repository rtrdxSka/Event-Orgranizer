import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getEvent,
  getOtherUserSuggestions,
  getUserEventResponse,
  submitEventResponse,
} from "@/lib/api";
import {
  Loader2,
  XCircle,
  Info,
  AlignLeft,
  Calendar,
  MapPin,
  Plus,
  Check,
  ThumbsUp,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/NavBar";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomFieldRenderer from "@/components/EventSubmitComponents/CustomFields";
import {
  eventSubmitSchema,
  validateEventSubmit,
} from "@/lib/validations/eventSubmit.schemas";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import { formatEventResponseData } from "@/lib/utils/formatEventResponseData";
import SuggestionDropdown from "@/components/EventSubmitComponents/SuggestionDropdown";
import { navigate } from "@/lib/navigation";

type EventSubmitFormData = z.infer<typeof eventSubmitSchema>;

const EventSubmit = () => {
  // Get the eventUUID from the URL params
  const { eventUUID } = useParams<{ eventUUID: string }>();
  const [suggestedDates, setSuggestedDates] = useState<string[]>([]);

  // State for suggested places (outside the form)
  const [suggestedPlaces, setSuggestedPlaces] = useState<string[]>([]);

  // State for validation errors
  const [validationError, setValidationError] = useState<string | null>(null);

  // Track if we've loaded user responses
  const [userResponseLoaded, setUserResponseLoaded] = useState(false);

  const { user } = useAuth();

  // Fetch event data with react-query (one-time fetch)
  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", eventUUID],
    queryFn: () => getEvent(eventUUID || ""),
    enabled: !!eventUUID,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    staleTime: Infinity,
  });

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<{
    selectedDates: string[];
    newDate: string;
    selectedPlaces: string[];
    newPlace: string;
    customFields: Record<string, any>;
  }>({
    defaultValues: {
      selectedDates: [],
      newDate: new Date().toISOString().split("T")[0] + "T12:00",
      selectedPlaces: [],
      newPlace: "",
      customFields: {},
    },
  });

  // Watch form values
  const selectedDates = watch("selectedDates");
  const newDate = watch("newDate");
  const selectedPlaces = watch("selectedPlaces");
  const newPlace = watch("newPlace");

  useEffect(() => {
    console.log("Event data updated:", event);
  }, [event]);

  // Fetch user's previous response once event is loaded
  const {
    data: userResponse,
    isLoading: isLoadingUserResponse,
    isError: isErrorUserResponse,
    error: userResponseError,
  } = useQuery({
    queryKey: ["userEventResponse", event?._id],
    queryFn: () => getUserEventResponse(event?._id),
    enabled: !!event?._id && !!user,
    onSuccess: (data) => {
      console.log("User response data:", data);
    },
    onError: (error) => {
      console.error("Error fetching user response:", error);
      // Only show toast for real errors, not 404s which are expected when there's no response
      if (error.status !== 404) {
        toast.error("Failed to load your previous response");
      }
    },
  });

  const { data: otherUserSuggestions, isLoading: isLoadingOtherSuggestions } =
    useQuery({
      queryKey: ["otherUserSuggestions", event?._id],
      queryFn: () => getOtherUserSuggestions(event?._id),
      enabled: !!event?._id && !!user && !isLoading && !isLoadingUserResponse,
      staleTime: Infinity, // Prevent unnecessary refetching
      cacheTime: 1000 * 60 * 60, // Cache for an hour
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      onError: (error) => {
        // Only show toast for real errors
        if (error.status !== 404) {
          console.error("Error fetching other suggestions:", error);
        }
      },
    });

  // Populate the form with the user's previous response
  useEffect(() => {
    if (userResponse?.data && event && !userResponseLoaded) {
      const {
        userVotes,
        userAddedOptions,
        userSuggestedDates,
        userSuggestedPlaces,
        fieldResponses,
      } = userResponse.data;
      console.log("User response:", userResponse.data);

      console.log("Loading user responses to form:", userResponse.data);

      // Set selected dates
      const dateVotes = userVotes["date"] || [];
      setValue("selectedDates", dateVotes);

      // Set suggested dates
      if (userSuggestedDates && userSuggestedDates.length > 0) {
        setSuggestedDates(userSuggestedDates);
      }

      // Set selected places
      const placeVotes = userVotes["place"] || [];
      setValue("selectedPlaces", placeVotes);

      // Set suggested places
      if (userSuggestedPlaces && userSuggestedPlaces.length > 0) {
        setSuggestedPlaces(userSuggestedPlaces);
      }

      // Initialize customFieldsData object
      const customFieldsData = {};

      // Handle custom fields responses
      if (fieldResponses && fieldResponses.length > 0) {
        // Process specific field responses first
        fieldResponses.forEach((fieldResponse) => {
          const { fieldId, type, response } = fieldResponse;
          const field = event.customFields?.[fieldId];

          if (!field) return; // Skip if field doesn't exist in the event

          // Handle different field types
          if (type === "text") {
            customFieldsData[fieldId] = response;
          } else if (type === "list") {
            // For list fields, we need to combine original values with user responses
            const originalValues = field.values || [];
            customFieldsData[fieldId] = [...originalValues, ...response];
          }
        });
      }

      // Handle voting fields (radio, checkbox)
      Object.entries(event.customFields || {}).forEach(([fieldId, field]) => {
        // Skip if we've already handled this field
        if (customFieldsData[fieldId]) return;

        // Handle radio and checkbox fields based on voting data
        if (field.type === "radio" || field.type === "checkbox") {
          // Find matching category in voting data
          const categoryName = field.title;
          const votes = userVotes[categoryName] || [];
          const userOptions = userAddedOptions[`field_${field.id}`] || [];

          if (field.type === "radio") {
            // For radio fields, just use the first vote (should be only one)
            const selectedValue = votes[0];
            if (selectedValue) {
              customFieldsData[fieldId] = {
                value: selectedValue,
                userAddedOptions: userOptions,
              };
            } else {
              // Initialize with empty structure
              customFieldsData[fieldId] = {
                value: "",
                userAddedOptions: userOptions,
              };
            }
          } else if (field.type === "checkbox") {
            // For checkbox fields, create a map of option ID -> true/false
            const checkboxData = {
              userAddedOptions: userOptions,
            };

            // Set original options
            field.options?.forEach((option) => {
              const isChecked = votes.includes(option.label);
              checkboxData[option.id.toString()] = isChecked;
            });

            // Set user-added options
            // Generate stable IDs for user-added options
            userOptions.forEach((option) => {
              // Use a hash-like approach for IDs to ensure they're stable
              const optionId = `user_${option
                .replace(/\s+/g, "_")
                .toLowerCase()}`;
              const isChecked = votes.includes(option);
              checkboxData[optionId] = isChecked;
            });

            customFieldsData[fieldId] = checkboxData;
          }
        }
      });

      // For fields not yet handled, initialize them with default values
      Object.entries(event.customFields || {}).forEach(([fieldId, field]) => {
        if (customFieldsData[fieldId]) return; // Skip if already handled

        switch (field.type) {
          case "text":
            // Initialize text fields with their default value or empty string
            customFieldsData[fieldId] = field.value || "";
            break;

          case "radio":
            // Initialize radio fields with an empty structure
            customFieldsData[fieldId] = {
              value: field.selectedOption
                ? field.options?.find((o) => o.id === field.selectedOption)
                    ?.label || ""
                : "",
              userAddedOptions: [],
            };
            break;

          case "checkbox":
            // Initialize checkbox fields with default checked states
            const checkboxData = {
              userAddedOptions: [],
            };

            field.options?.forEach((option) => {
              checkboxData[option.id.toString()] = option.checked || false;
            });

            customFieldsData[fieldId] = checkboxData;
            break;

          case "list":
            // Initialize list fields with their original values
            customFieldsData[fieldId] = field.values || [];
            break;
        }
      });

      console.log("Setting custom fields:", customFieldsData);
      setValue("customFields", customFieldsData);
      setUserResponseLoaded(true);
    }
  }, [userResponse, event, setValue, userResponseLoaded]);

  // Handle adding a new date suggestion
  const handleAddDate = () => {
    if (!newDate || !event?.eventDates) return;

    // Ensure we have both date and time
    const [datePart, timePart] = newDate.split("T");
    if (!datePart || !timePart) {
      toast.error("Please select both date and time");
      return;
    }

    // Create a proper date object with the date and time
    const dateObj = new Date(`${datePart}T${timePart}:00`);
    const dateStr = dateObj.toISOString();

    // Check if date already exists
    const allDates = [...(event.eventDates.dates || []), ...suggestedDates];
    const dateExists = allDates.some((d) => {
      const existingDate = new Date(d);
      // Compare both date and time (within 1 minute tolerance)
      return Math.abs(existingDate.getTime() - dateObj.getTime()) < 60000;
    });

    if (dateExists) {
      toast.error("This date and time has already been suggested.");
      return;
    }

    // Validate adding a new date
    if (!event.eventDates.allowUserAdd) {
      toast.error("New dates cannot be added for this event");
      return;
    }

    if (
      event.eventDates.maxDates > 0 &&
      event.eventDates.dates.length + suggestedDates.length >=
        event.eventDates.maxDates
    ) {
      toast.error(
        `Too many dates. Maximum allowed is ${event.eventDates.maxDates}`
      );
      return;
    }

    setSuggestedDates([...suggestedDates, dateStr]);
    setValidationError(null);
  };

  // Handle date voting
  const handleDateVote = (dateStr: string, isVoted: boolean) => {
    console.log(`Vote clicked for ${dateStr}, current status: ${isVoted}`);
    if (!event?.eventDates?.maxVotes) return;

    if (isVoted) {
      setValue(
        "selectedDates",
        selectedDates.filter((d) => d !== dateStr)
      );
      setValidationError(null);
    } else if (selectedDates.length < event.eventDates.maxVotes) {
      setValue("selectedDates", [...selectedDates, dateStr]);
      setValidationError(null);
    } else {
      toast.error(
        `You can only vote for ${event.eventDates.maxVotes} dates maximum.`
      );
    }
  };

  // Handle removing a suggested date
  const handleRemoveSuggestedDate = (dateStr: string) => {
    setSuggestedDates(suggestedDates.filter((d) => d !== dateStr));

    // Also remove any votes for this date
    if (selectedDates.includes(dateStr)) {
      setValue(
        "selectedDates",
        selectedDates.filter((d) => d !== dateStr)
      );
    }
    setValidationError(null);
  };

  // Handle adding a new place suggestion
  const handleAddPlace = () => {
    if (!newPlace || !event?.eventPlaces) return;

    // Check if place already exists
    const allPlaces = [...(event.eventPlaces.places || []), ...suggestedPlaces];
    const placeExists = allPlaces.some(
      (p) => p.toLowerCase().trim() === newPlace.toLowerCase().trim()
    );

    if (placeExists) {
      toast.error("This place has already been suggested.");
      return;
    }

    // Validate adding a new place
    if (!event.eventPlaces.allowUserAdd) {
      toast.error("New places cannot be added for this event");
      return;
    }

    if (
      event.eventPlaces.maxPlaces > 0 &&
      event.eventPlaces.places.length + suggestedPlaces.length >=
        event.eventPlaces.maxPlaces
    ) {
      toast.error(
        `Too many places. Maximum allowed is ${event.eventPlaces.maxPlaces}`
      );
      return;
    }

    setSuggestedPlaces([...suggestedPlaces, newPlace.trim()]);
    setValue("newPlace", ""); // Clear the input field
    setValidationError(null);
  };

  // Handle place voting
  const handlePlaceVote = (place: string, isVoted: boolean) => {
    console.log(`Vote clicked for place: ${place}, current status: ${isVoted}`);
    if (!event?.eventPlaces?.maxVotes) return;

    if (isVoted) {
      setValue(
        "selectedPlaces",
        selectedPlaces.filter((p) => p !== place)
      );
      setValidationError(null);
    } else if (selectedPlaces.length < event.eventPlaces.maxVotes) {
      setValue("selectedPlaces", [...selectedPlaces, place]);
      setValidationError(null);
    } else {
      toast.error(
        `You can only vote for ${event.eventPlaces.maxVotes} places maximum.`
      );
    }
  };

  // Handle removing a suggested place
  const handleRemoveSuggestedPlace = (place: string) => {
    setSuggestedPlaces(suggestedPlaces.filter((p) => p !== place));

    // Also remove any votes for this place
    if (selectedPlaces.includes(place)) {
      setValue(
        "selectedPlaces",
        selectedPlaces.filter((p) => p !== place)
      );
    }
    setValidationError(null);
  };

  // Handle form submission
  const {
    mutate: submitResponse,
    isPending,
    isSuccess,
    isError,
    error: submitError,
  } = useMutation({
    mutationFn: submitEventResponse,
    onSuccess: (data) => {
      toast.success("Your responses have been submitted successfully!");
      // Optionally redirect to another page or update UI
      console.log("Response submitted successfully:", data);
    },
    onError: (error) => {
      const errorMessage = error?.message || "Failed to submit your response";
      setValidationError(errorMessage);
      toast.error(errorMessage);
      console.error("Submission error:", error);
    },
  });

  const onSubmit = (formData: {
    selectedDates: string[];
    newDate: string;
    selectedPlaces: string[];
    newPlace: string;
    customFields: Record<string, any>;
  }) => {
    if (!event) return;

    // Create the data structure expected by the validation function
    const validateData: EventSubmitFormData = {
      originalEvent: {
        name: event.name,
        description: event.description,
        eventDates: {
          allowUserAdd: event.eventDates.allowUserAdd,
          dates: event.eventDates.dates || [],
          maxDates: event.eventDates.maxDates || 0,
          maxVotes: event.eventDates.maxVotes || 0,
        },
        eventPlaces: {
          allowUserAdd: event.eventPlaces.allowUserAdd,
          places: event.eventPlaces.places || [],
          maxPlaces: event.eventPlaces.maxPlaces || 0,
          maxVotes: event.eventPlaces.maxVotes || 0,
        },
        customFields: event.customFields || {},
      },
      selectedDates: formData.selectedDates,
      suggestedDates: suggestedDates,
      selectedPlaces: formData.selectedPlaces,
      suggestedPlaces: suggestedPlaces,
      customFields: formData.customFields,
    };

    // Validate submission
    const validationResult = validateEventSubmit(validateData);

    if (validationResult !== true) {
      setValidationError(validationResult);
      toast.error(validationResult);
      return;
    }

    // If validation passes, format the response data
    const responseData = formatEventResponseData(
      event,
      user._id,
      user.email,
      user.name,
      {
        selectedDates: formData.selectedDates,
        selectedPlaces: formData.selectedPlaces,
        customFields: formData.customFields,
      },
      suggestedDates,
      suggestedPlaces
    );

    // Process the custom fields to remove read-only fields and extract only user-added entries for lists
    const processedCustomFields = {};

    if (event.customFields) {
      Object.entries(formData.customFields).forEach(([fieldId, fieldValue]) => {
        const fieldDef = event.customFields[fieldId];

        // Skip read-only fields entirely
        if (fieldDef?.readonly) {
          return;
        }

        // Handle list fields - only include user-added values
        if (fieldDef?.type === "list" && Array.isArray(fieldValue)) {
          const originalValues = fieldDef.values || [];
          const userAddedValues = fieldValue.slice(originalValues.length);

          // Only add if there are user-added values
          if (userAddedValues.length > 0) {
            processedCustomFields[fieldId] = userAddedValues;
          }
        } else {
          // For other field types, include as is
          processedCustomFields[fieldId] = fieldValue;
        }
      });
    }

    // Create the final submission payload with properly processed data
    const submissionData = {
      eventId: event._id,
      selectedDates: formData.selectedDates,
      selectedPlaces: formData.selectedPlaces,
      suggestedDates: suggestedDates,
      suggestedPlaces: suggestedPlaces,
      customFields: processedCustomFields, // Use the processed custom fields
      votingCategories: responseData.votingCategories,
      suggestedOptions: responseData.suggestedOptions,
    };

    console.log("Submitting data:", submissionData);

    // Submit to backend
    submitResponse(submissionData);

    // Clear any validation errors
    setValidationError(null);
  };

  // Format date for display, including time
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    // Format the date part
    const dateFormatted = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format the time part
    const timeFormatted = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${dateFormatted} at ${timeFormatted}`;
  };

  if (event && (event.status === "closed" || event.status === "finalized")) {
    return (
      <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-purple-950/80" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-md px-4 pt-16 text-center">
            <div className="p-8 bg-purple-900/40 rounded-xl border border-purple-700/50">
              <Calendar className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-purple-100 mb-2">
                {event.status === "closed" ? "Event Closed" : "Event Finalized"}
              </h2>
              <p className="text-purple-200 mb-6">
                {event.status === "closed"
                  ? "This event is no longer accepting responses as it has been closed by the organizer."
                  : "This event has been finalized. The details have been confirmed and no further changes can be made."}
              </p>
              {event.eventDate && (
                <div className="bg-purple-800/30 p-3 rounded-lg mb-4">
                  <h3 className="font-medium text-lg text-purple-100 mb-1">
                    Final Date
                  </h3>
                  <p className="text-purple-200">
                    {formatDate(event.eventDate)}
                  </p>
                </div>
              )}
              {event.place && (
                <div className="bg-purple-800/30 p-3 rounded-lg">
                  <h3 className="font-medium text-lg text-purple-100 mb-1">
                    Final Location
                  </h3>
                  <p className="text-purple-200">{event.place}</p>
                </div>
              )}
              <Button
                onClick={() => navigate("/events")}
                className="mt-6 bg-purple-200 text-purple-950 hover:bg-purple-100 "
              >
                View My Events
              </Button>
              <Button
                type="button"
                onClick={() => navigate(`/event/finalized/${eventUUID}`)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium shadow-lg transition-all duration-200 flex items-center gap-2 w-full max-w-xs"
              >
                <ExternalLink className="h-4 w-4" />
                View Finalized Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              {error instanceof Error
                ? error.message
                : "Unable to find this event. It may have been removed or the link is incorrect."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate if we can add more dates
  const canAddMoreDates =
    !event.eventDates?.maxDates ||
    event.eventDates.dates.length + suggestedDates.length <
      event.eventDates.maxDates;

  // Calculate if we can add more places
  const canAddMorePlaces =
    !event.eventPlaces?.maxPlaces ||
    event.eventPlaces.places.length + suggestedPlaces.length <
      event.eventPlaces.maxPlaces;

  // If loading user responses
  if (isLoadingUserResponse && !userResponseLoaded) {
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
              Loading Your Responses
            </h2>
            <p className="text-purple-200">
              Please wait while we fetch your previous responses...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-purple-900/40 rounded-xl p-8 border border-purple-700/50">
            <h1 className="text-3xl font-bold text-purple-100 mb-6 text-center">
              Event Details
            </h1>

            {userResponse?.data?.hasResponse && (
              <div className="mb-6 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-center">
                  You previously responded to this event. Your responses have
                  been loaded and you can edit them below.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Event information fields */}
              <div className="space-y-6">
                {/* Event Name Field */}
                <div className="bg-purple-800/30 rounded-lg p-6">
                  <div className="flex items-center mb-2">
                    <Info className="h-5 w-5 text-purple-300 mr-2" />
                    <h2 className="text-xl font-semibold text-purple-100">
                      Event Name
                    </h2>
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
                    <h2 className="text-xl font-semibold text-purple-100">
                      Event Description
                    </h2>
                  </div>
                  <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                    <p className="text-purple-200 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Event Dates Field */}
                {event.eventDates && (
                  <div className="bg-purple-800/30 rounded-lg p-6">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-purple-300 mr-2" />
                      <h2 className="text-xl font-semibold text-purple-100">
                        Event Dates
                      </h2>
                    </div>
                    <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                      {/* Available dates section */}
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-purple-200 mb-2">
                          Available Dates
                        </h3>
                        {event.eventDates.dates.length > 0 ||
                        suggestedDates.length > 0 ? (
                          <div className="space-y-2">
                            {/* Existing dates from the event */}
                            {event.eventDates.dates.map((dateStr, index) => {
                              const isVoted = selectedDates.includes(dateStr);

                              return (
                                <div
                                  key={`existing-${index}`}
                                  className="flex items-center justify-between p-2 bg-purple-800/40 rounded"
                                >
                                  <span className="text-purple-100">
                                    {formatDate(dateStr)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDateVote(dateStr, isVoted)
                                    }
                                    className={`px-3 py-1 rounded flex items-center ${
                                      isVoted
                                        ? "bg-purple-500 text-white"
                                        : "bg-purple-900 text-purple-300 hover:bg-purple-800"
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
                                <div
                                  key={`suggested-${index}`}
                                  className="flex items-center justify-between p-2 bg-purple-700/40 rounded border border-purple-500/30"
                                >
                                  <div className="flex items-center">
                                    <span className="text-purple-100">
                                      {formatDate(dateStr)}
                                    </span>
                                    <span className="ml-2 px-2 py-0.5 bg-purple-600/50 text-purple-200 rounded text-xs">
                                      Your suggestion
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDateVote(dateStr, isVoted)
                                      }
                                      className={`px-3 py-1 rounded flex items-center ${
                                        isVoted
                                          ? "bg-purple-500 text-white"
                                          : "bg-purple-900 text-purple-300 hover:bg-purple-800"
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
                                      onClick={() =>
                                        handleRemoveSuggestedDate(dateStr)
                                      }
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
                          <p className="text-purple-300 italic">
                            No dates have been specified for this event.
                          </p>
                        )}
                      </div>

                      {/* Add new date section */}
                      {event.eventDates.allowUserAdd && (
                        <div className="mt-4 pt-4 border-t border-purple-600/30">
                          <h3 className="text-lg font-medium text-purple-200 mb-2">
                            Suggest New Date
                          </h3>
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
                                      value={field.value?.split("T")[0] || ""}
                                      onChange={(e) => {
                                        const timePart =
                                          field.value?.split("T")[1] || "12:00";
                                        field.onChange(
                                          `${e.target.value}T${timePart}`
                                        );
                                      }}
                                      className="flex-1 bg-purple-900/40 border border-purple-600 rounded p-2 text-purple-100"
                                    />
                                    <Input
                                      type="time"
                                      value={
                                        field.value?.split("T")[1] || "12:00"
                                      }
                                      onChange={(e) => {
                                        const datePart =
                                          field.value?.split("T")[0] ||
                                          new Date()
                                            .toISOString()
                                            .split("T")[0];
                                        field.onChange(
                                          `${datePart}T${e.target.value}`
                                        );
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
                                disabled={!newDate?.includes("T")}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          )}

                          {!canAddMoreDates &&
                            event.eventDates.maxDates > 0 && (
                              <p className="text-yellow-300">
                                Maximum number of dates (
                                {event.eventDates.maxDates}) has been reached.
                              </p>
                            )}
                        </div>
                      )}

                      {/* Other users' suggested dates */}
                      {otherUserSuggestions?.data?.uniqueSuggestions?.dates &&
                        otherUserSuggestions.data.uniqueSuggestions.dates
                          .length > 0 && (
                          <div className="mt-4 pt-4 border-t border-purple-600/30">
                            <SuggestionDropdown
                              fieldId="date"
                              fieldTitle="Event Date"
                              suggestions={
                                otherUserSuggestions.data.uniqueSuggestions
                                  .dates
                              }
                              onSelect={(dateStr) => {
                                if (
                                  event?.eventDates?.allowUserAdd &&
                                  !event.eventDates.dates.includes(dateStr) &&
                                  !suggestedDates.includes(dateStr)
                                ) {
                                  setSuggestedDates([
                                    ...suggestedDates,
                                    dateStr,
                                  ]);
                                  setValidationError(null);
                                }
                              }}
                              type="date"
                            />
                          </div>
                        )}

                      {/* Voting information */}
                      <div className="mt-4 bg-purple-800/30 p-3 rounded">
                        <p className="text-purple-300 text-sm">
                          You have selected {selectedDates.length} of{" "}
                          {event.eventDates.maxVotes || 0} possible votes.
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
                      <h2 className="text-xl font-semibold text-purple-100">
                        Event Places
                      </h2>
                    </div>
                    <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                      {/* Available places section */}
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-purple-200 mb-2">
                          Available Places
                        </h3>
                        {event.eventPlaces.places.length > 0 ||
                        suggestedPlaces.length > 0 ? (
                          <div className="space-y-2">
                            {/* Existing places from the event */}
                            {event.eventPlaces.places.map((place, index) => {
                              const isVoted = selectedPlaces.includes(place);

                              return (
                                <div
                                  key={`existing-place-${index}`}
                                  className="flex items-center justify-between p-2 bg-purple-800/40 rounded"
                                >
                                  <span className="text-purple-100">
                                    {place}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePlaceVote(place, isVoted)
                                    }
                                    className={`px-3 py-1 rounded flex items-center ${
                                      isVoted
                                        ? "bg-purple-500 text-white"
                                        : "bg-purple-900 text-purple-300 hover:bg-purple-800"
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
                                <div
                                  key={`suggested-place-${index}`}
                                  className="flex items-center justify-between p-2 bg-purple-700/40 rounded border border-purple-500/30"
                                >
                                  <div className="flex items-center">
                                    <span className="text-purple-100">
                                      {place}
                                    </span>
                                    <span className="ml-2 px-2 py-0.5 bg-purple-600/50 text-purple-200 rounded text-xs">
                                      Your suggestion
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePlaceVote(place, isVoted)
                                      }
                                      className={`px-3 py-1 rounded flex items-center ${
                                        isVoted
                                          ? "bg-purple-500 text-white"
                                          : "bg-purple-900 text-purple-300 hover:bg-purple-800"
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
                                      onClick={() =>
                                        handleRemoveSuggestedPlace(place)
                                      }
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
                          <p className="text-purple-300 italic">
                            No places have been specified for this event.
                          </p>
                        )}
                      </div>

                      {/* Add new place section */}
                      {event.eventPlaces.allowUserAdd && (
                        <div className="mt-4 pt-4 border-t border-purple-600/30">
                          <h3 className="text-lg font-medium text-purple-200 mb-2">
                            Suggest New Place
                          </h3>
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

                          {!canAddMorePlaces &&
                            event.eventPlaces.maxPlaces > 0 && (
                              <p className="text-yellow-300">
                                Maximum number of places (
                                {event.eventPlaces.maxPlaces}) has been reached.
                              </p>
                            )}
                        </div>
                      )}

                      {/* Other users' suggested places */}
                      {otherUserSuggestions?.data?.uniqueSuggestions?.places &&
                        otherUserSuggestions.data.uniqueSuggestions.places
                          .length > 0 && (
                          <div className="mt-4 pt-4 border-t border-purple-600/30">
                            <SuggestionDropdown
                              fieldId="place"
                              fieldTitle="Event Place"
                              suggestions={
                                otherUserSuggestions.data.uniqueSuggestions
                                  .places
                              }
                              onSelect={(place) => {
                                if (
                                  event?.eventPlaces?.allowUserAdd &&
                                  !event.eventPlaces.places.includes(place) &&
                                  !suggestedPlaces.includes(place)
                                ) {
                                  setSuggestedPlaces([
                                    ...suggestedPlaces,
                                    place,
                                  ]);
                                  setValidationError(null);
                                }
                              }}
                              type="place"
                            />
                          </div>
                        )}

                      {/* Voting information */}
                      <div className="mt-4 bg-purple-800/30 p-3 rounded">
                        <p className="text-purple-300 text-sm">
                          You have selected {selectedPlaces.length} of{" "}
                          {event.eventPlaces.maxVotes || 0} possible votes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Fields Section */}
              {event.customFields &&
                Object.keys(event.customFields).length > 0 && (
                  <div className="bg-purple-800/30 rounded-lg p-6 mt-6">
                    <div className="flex items-center mb-2">
                      <AlignLeft className="h-5 w-5 text-purple-300 mr-2" />
                      <h2 className="text-xl font-semibold text-purple-100">
                        Additional Information
                      </h2>
                    </div>
                    <div className="bg-purple-700/30 rounded-md p-4 border border-purple-600/50">
                      <div className="space-y-6">
                        {/* Render each custom field */}
                        {Object.entries(event.customFields).map(
                          ([fieldKey, fieldData]) => {
                            // Get suggestions for this specific field if available
                            const fieldSuggestions =
                              otherUserSuggestions?.data?.uniqueSuggestions
                                ?.customFields?.[fieldKey] || [];

                            return (
                              <CustomFieldRenderer
                                key={fieldKey}
                                field={{
                                  ...fieldData,
                                  id: fieldKey,
                                }}
                                formMethods={{
                                  control,
                                  watch,
                                  setValue,
                                  handleSubmit,
                                  formState: { errors },
                                }}
                                suggestions={fieldSuggestions}
                              />
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Display validation errors */}
              {validationError && (
                <div className="mt-6 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-center">{validationError}</p>
                </div>
              )}

              {/* Submit button */}
              <div className="mt-8 flex justify-center">
                <Button
                  type="submit"
                  className="bg-purple-500 hover:bg-purple-400 text-white font-medium px-6 py-3 rounded-lg"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {userResponse?.data?.hasResponse
                        ? "Updating..."
                        : "Submitting..."}
                    </>
                  ) : userResponse?.data?.hasResponse ? (
                    "Update Responses"
                  ) : (
                    "Submit Responses"
                  )}
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
