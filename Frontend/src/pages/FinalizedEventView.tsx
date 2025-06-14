// Updated FinalizedEventView.tsx with Google Calendar integration
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFinalizedEvent } from '@/lib/api';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import Navbar from '@/components/NavBar';
import { Calendar, MapPin, CheckCircle, UserCircle, Clock, ListChecks, AlertCircle, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { CustomFieldSelection, FinalizedEventData } from '@/types';

// Define types for finalized event data (same as before)


const FinalizedEventView: React.FC = () => {
  const { eventUUID } = useParams<{ eventUUID: string }>();
  
  // Google Calendar hook
  const { 
    isAuthenticated: isGoogleAuthenticated,
    addToGoogleCalendar,
    authenticate: authenticateGoogle,
    disconnect: disconnectGoogle,
    isAuthenticating,
    isAddingToCalendar,
    isDisconnecting,
    isCheckingAuth
  } = useGoogleCalendar();
  
  // Fetch finalized event data
  const { data, isLoading, isError, error } = useQuery<FinalizedEventData>({
    queryKey: ['finalizedEvent', eventUUID],
    queryFn: () => getFinalizedEvent(eventUUID || ''),
    enabled: !!eventUUID,
  });

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not specified';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e: unknown) {
      console.error('Error formatting date:', e);
      return dateStr;
    }
  };

  // Handle Google Calendar integration
const handleAddToGoogleCalendar = () => {
  console.log('Button clicked!'); // Add this first
  console.log('Data:', data); // Check if data exists
  console.log('Auth status:', isGoogleAuthenticated); // Check auth status
  
  if (!data || !data.finalizedEvent.finalizedDate) {
    console.log('No data or date available'); // Debug this condition
    toast.error('No confirmed date available for this event');
    return;
  }

  const eventData = {
    title: data.event.name,
    description: data.event.description || 'Event created with EventPlanner',
    startDate: data.finalizedEvent.finalizedDate,
    location: data.finalizedEvent.finalizedPlace || undefined,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  console.log('About to call addToGoogleCalendar with:', eventData);
  addToGoogleCalendar(eventData);
  console.log('Called addToGoogleCalendar');
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
              Loading Event Details
            </h2>
            <p className="text-purple-200">
              Please wait while we fetch the finalized event information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !data) {
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
              {error instanceof Error ? error.message : "This event doesn't exist or hasn't been finalized yet."}
            </p>
            <Button 
              onClick={() => window.history.back()}
              className="bg-purple-200 text-purple-950 hover:bg-purple-100"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Group custom fields
  const groupedFields = groupFieldsByType(data.finalizedEvent.customFieldSelections);

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
                The organizer has confirmed the final details for this event.
              </p>
            </div>
          </div>

          {/* Event Header */}
          <Card className="bg-purple-900/40 border-purple-700/50 mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl font-bold text-purple-100">
                    {data.event.name}
                  </CardTitle>
                  <CardDescription className="text-purple-200 mt-2 text-base">
                    {data.event.description}
                  </CardDescription>
                </div>
                <Badge className="bg-blue-600/30 text-blue-200">Finalized</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-purple-300 mb-3">
                <UserCircle className="h-4 w-4" />
                <span>Organized by: {data.organizer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-300">
                <Clock className="h-4 w-4" />
                <span>Finalized on: {formatDate(data.finalizedEvent.finalizedAt)}</span>
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
                    {formatDate(data.finalizedEvent.finalizedDate)}
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
                    {data.finalizedEvent.finalizedPlace || 'No location specified'}
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
                          <span className="text-purple-100">{selection.selection as React.ReactNode}</span>
                        )}
                        
                        {/* Radio field (single selection) */}
                        {selection.fieldType === 'radio' && (
                          <div className="flex items-center gap-2 bg-purple-700/40 p-3 rounded">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span className="text-purple-100">{selection.selection as React.ReactNode}</span>
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
                                <span className="text-purple-100">{selection.selection as React.ReactNode}</span>
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
                                <span className="text-purple-100">{selection.selection as React.ReactNode}</span>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-purple-100">Add to Your Calendar</CardTitle>
                {/* Google Calendar Settings */}
                {isGoogleAuthenticated && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-purple-300 hover:text-purple-100">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-purple-900 border-purple-700">
                      <DropdownMenuLabel className="text-purple-200">Google Calendar</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-purple-700" />
                      <DropdownMenuItem 
                        onClick={() => disconnectGoogle()}
                        disabled={isDisconnecting}
                        className="text-red-300 hover:text-red-200 hover:bg-red-900/30"
                      >
                        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {/* Google Calendar Button */}
<Button 
  className="bg-purple-600 hover:bg-purple-500 relative disabled:opacity-50"
  onClick={() => {
    console.log('Raw button click detected');
    if (isGoogleAuthenticated) {
      console.log('User is authenticated, calling handleAddToGoogleCalendar');
      handleAddToGoogleCalendar();
    } else {
      console.log('User not authenticated, calling authenticateGoogle');
      authenticateGoogle();
    }
  }}
  disabled={isAddingToCalendar || isAuthenticating || isCheckingAuth}
>
  <Calendar className="h-4 w-4 mr-2" />
  {isCheckingAuth ? 'Checking...' :
   isAuthenticating ? 'Connecting...' : 
   isAddingToCalendar ? 'Adding...' :
   isGoogleAuthenticated ? 'Add to Google Calendar' : 'Connect Google Calendar'}
  
  {/* Auth status indicator */}
  {isGoogleAuthenticated && !isCheckingAuth && (
    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-purple-600" />
  )}
</Button>
              </div>
              
              {/* Google Calendar Status Message */}
              {isGoogleAuthenticated && (
                <div className="mt-3 p-2 bg-green-900/30 border border-green-700/50 rounded-md">
                  <p className="text-green-200 text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Google Calendar connected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Contact Organizer Section */}
          <div className="bg-purple-800/30 rounded-lg p-4 mt-6 flex items-start gap-3 border border-purple-700/50">
            <AlertCircle className="h-5 w-5 text-purple-300 mt-0.5" />
            <div>
              <p className="text-purple-200">
                If you have any questions about this event, please contact the organizer at{" "}
                <span className="text-purple-100">{data.organizer.email}</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizedEventView;