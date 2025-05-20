import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserCreatedEvents, getUserRespondedEvents } from "@/lib/api";
import { EventGet } from "@/types";
import Navbar from "@/components/NavBar";
import {
  Loader2,
  XCircle,
  Calendar,
  Users,
  Plus,
  Clock,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

const MyEvents = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdEvents, setCreatedEvents] = useState<EventGet[]>([]);
  const [respondedEvents, setRespondedEvents] = useState<EventGet[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const [created, responded] = await Promise.all([
          getUserCreatedEvents(),
          getUserRespondedEvents(),
        ]);
        setCreatedEvents(created);
        setRespondedEvents(responded);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleEventClick = (event: EventGet, isCreator: boolean) => {
    if (isCreator) {
      navigate(`/event/edit/${event._id}`);
    } else {
      navigate(`/event/submit/${event.eventUUID}`);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
              Loading Events
            </h2>
            <p className="text-purple-200">
              Please wait while we fetch your events...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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
              Error Loading Events
            </h2>
            <p className="text-red-300 mb-8">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-purple-200 text-purple-950 hover:bg-purple-100"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Event card component
  const EventCard = ({
    event,
    isCreator,
  }: {
    event: EventGet;
    isCreator: boolean;
  }) => {
    // Get the response count that we added from the backend
    const otherResponsesCount = event.otherResponsesCount || 0;
    const [copied, setCopied] = useState(false);

    const copyEventLink = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click event from firing

      // Create the full URL
      const baseUrl = window.location.origin;
      const eventLink = `${baseUrl}/event/submit/${event.eventUUID}`;

      // Copy to clipboard
      navigator.clipboard
        .writeText(eventLink)
        .then(() => {
          setCopied(true);
          toast.success("Link copied to clipboard!");

          // Reset the copied state after 2 seconds
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          toast.error("Failed to copy link");
        });
    };

    return (
      <Card
        className="bg-purple-900/40 border-purple-700/50 hover:bg-purple-900/60 transition-all duration-300 cursor-pointer flex flex-col h-full"
        onClick={() => handleEventClick(event, isCreator)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl text-purple-100">
              {event.name}
            </CardTitle>
            <Badge className={`${isCreator ? "bg-blue-600" : "bg-purple-600"}`}>
              {isCreator ? "Your Event" : "Responded"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-300">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDate(event.createdAt)}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-purple-200 line-clamp-2 mb-4">
            {event.description}
          </p>

          {/* Display event date */}
          <div className="flex items-center gap-2 text-sm mb-2">
            <Clock className="h-4 w-4" />
            {event.eventDate ? (
              <span className="text-green-300">
                Date: {formatDate(event.eventDate)}
              </span>
            ) : (
              <span className="text-purple-300">Date: TBD</span>
            )}
          </div>

          {/* Display place if finalized */}
          {event.place && (
            <div className="flex items-center gap-2 text-sm text-purple-300">
              <MapPin className="h-4 w-4" />
              <span>{event.place}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2 border-t border-purple-700/30">
          {/* Use flex layout with full width and justify-between */}
          <div className="w-full flex justify-between items-center">
            {/* Left side - Response count */}
            <div className="flex items-center gap-1 text-sm text-purple-300">
              <Users className="h-4 w-4" />
              {otherResponsesCount > 0 ? (
                <span>
                  {otherResponsesCount}{" "}
                  {otherResponsesCount === 1
                    ? "other response"
                    : "other responses"}
                </span>
              ) : (
                <span>No other responses yet</span>
              )}
            </div>

            {/* Right side - Copy Link button */}
            {isCreator && (
              <Button
                size="sm"
                variant="ghost"
                className="py-1 px-3 ml-auto bg-purple-800/50 hover:bg-purple-700 text-purple-200 hover:text-white flex items-center gap-1"
                onClick={copyEventLink}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-purple-950">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-purple-100">My Events</h1>
            <Button
              onClick={() => navigate("/event/create")}
              className="bg-purple-200 text-purple-950 hover:bg-purple-100 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Event
            </Button>
          </div>

          {/* Created Events Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-purple-100 mb-4">
              Events You Created
            </h2>
            {createdEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {createdEvents.map((event) => (
                  <EventCard key={event._id} event={event} isCreator={true} />
                ))}
              </div>
            ) : (
              <div className="bg-purple-900/30 rounded-lg p-8 text-center">
                <p className="text-purple-200 mb-4">
                  You haven't created any events yet.
                </p>
                <Button
                  onClick={() => navigate("/event/create")}
                  className="bg-purple-200 text-purple-950 hover:bg-purple-100"
                >
                  Create Your First Event
                </Button>
              </div>
            )}
          </div>

          {/* Responded Events Section */}
          <div>
            <h2 className="text-2xl font-semibold text-purple-100 mb-4">
              Events You Responded To
            </h2>
            {respondedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {respondedEvents.map((event) => (
                  <EventCard key={event._id} event={event} isCreator={false} />
                ))}
              </div>
            ) : (
              <div className="bg-purple-900/30 rounded-lg p-8 text-center">
                <p className="text-purple-200">
                  You haven't responded to any events yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyEvents;
