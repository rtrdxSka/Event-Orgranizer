import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeEvent, reopenEvent, finalizeEvent } from '@/lib/api';
import { AlertCircle, X, Calendar, MapPin, CheckCircle, Lock, Unlock, AlertTriangle  } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldType } from '@/types';

type BackendCustomField = {
  type: FieldType;
  title: string;
  placeholder: string;
  value: string;
  required: boolean;
  readonly: boolean;
  maxVotes?: number;
  options?: { id: number; label: string; checked?: boolean }[];
  values?: string[];
  maxEntries?: number;
  allowUserAdd?: boolean;
  maxOptions?: number;
  allowUserAddOptions?: boolean;
  selectedOption?: number | null;
};

// Define Props
interface EventStatusManagementProps {
  event: {
    _id: string;
    name: string;
    status: 'open' | 'closed' | 'finalized';
    eventDate?: string | null;
    place?: string | null;
    customFields?: Record<string, BackendCustomField>;
  };
  // For final date selection, the event's voting categories
  dateOptions?: { optionName: string, voteCount: number }[] | null;
  placeOptions?: { optionName: string, voteCount: number }[] | null;
  // Data prepared for finalization from EventEdit component
  finalizeData?: {
    date: string | null;
    place: string | null;
    customFields: Record<string, string | string[] | number | boolean>;
  } | null;
  // Validation function from parent
  validateSelections?: () => boolean;
}

const EventStatusManagement: React.FC<EventStatusManagementProps> = ({ 
  event,
  finalizeData,
  validateSelections
}) => {
  const queryClient = useQueryClient();
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  
  // For finalize dialog
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  
  // Update selected date and place when finalizeData changes
  React.useEffect(() => {
    if (finalizeData) {
      setSelectedDate(finalizeData.date);
      setSelectedPlace(finalizeData.place);
    }
  }, [finalizeData]);
  
  // Mutation for closing an event
  const closeMutation = useMutation({
    mutationFn: () => closeEvent(event._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventEdit', event._id] });
      toast.success('Event closed successfully');
      setIsCloseDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to close event');
    }
  });
  
  // Mutation for reopening an event
  const reopenMutation = useMutation({
    mutationFn: () => reopenEvent(event._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventEdit', event._id] });
      toast.success('Event reopened successfully');
      setIsReopenDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reopen event');
    }
  });
  
  // Mutation for finalizing an event
  const finalizeMutation = useMutation({
    mutationFn: () => finalizeEvent(event._id, finalizeData || {
      date: selectedDate,
      place: selectedPlace,
      customFields: {} as Record<string, string | string[] | number | boolean>
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventEdit', event._id] });
      toast.success('Event finalized successfully');
      setIsFinalizeDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to finalize event');
    }
  });
  
  // Format date for display
  const formatDate = (dateStr: string) => {
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
    } catch {
      return dateStr;
    }
  };
  


  // Get appropriate status badge
  const getStatusBadge = () => {
    switch (event.status) {
      case 'open':
        return <Badge className="bg-green-600/30 text-green-200">Open for Responses</Badge>;
      case 'closed':
        return <Badge className="bg-yellow-600/30 text-yellow-200">Closed for Responses</Badge>;
      case 'finalized':
        return <Badge className="bg-blue-600/30 text-blue-200">Finalized</Badge>;
      default:
        return null;
    }
  };

  // Handle finalize button click
  const handleFinalizeClick = () => {
    // Reset validation message
    setValidationMessage(null);
    
    // First check if we have the validate function from parent
    if (validateSelections) {
      const isValid = validateSelections();
      if (!isValid) {
        return; // Don't open dialog if validation fails
      }
    }
    
    // Open the finalize dialog
    setIsFinalizeDialogOpen(true);
  };

  // Handle the actual finalization
  const handleFinalize = () => {
    // Check if we have the validate function from parent
    if (validateSelections) {
      const isValid = validateSelections();
      if (!isValid) {
        setIsFinalizeDialogOpen(false);
        return;
      }
    }
    
    // Everything is valid, proceed with finalization
    finalizeMutation.mutate();
  };

  // Show validation details in finalize dialog
  const getFinalizationSummary = () => {
    if (!finalizeData) return null;
    
    const details = [];
    
    // Add date info
    if (finalizeData.date) {
      details.push({ 
        label: 'Date', 
        value: formatDate(finalizeData.date) 
      });
    }
    
    // Add place info
    if (finalizeData.place) {
      details.push({ 
        label: 'Location', 
        value: finalizeData.place 
      });
    }
    
    // Add custom fields info
    if (finalizeData.customFields) {
      Object.entries(finalizeData.customFields).forEach(([fieldId, value]) => {
        // Find field title
        let fieldTitle = fieldId;
        
        // Check if there's a field definition with this ID
        if (event.customFields) {
          const field = event.customFields[fieldId];
          if (field && field.title) {
            fieldTitle = field.title;
          }
        }
        
        // Format the value based on type
        let displayValue: string;
       if (Array.isArray(value)) {
  displayValue = value.join(', ');
} else if (value !== null && value !== undefined) {
  displayValue = String(value);
} else {
  displayValue = '';
}
        
        // Add to details
        details.push({
          label: fieldTitle,
          value: displayValue
        });
      });
    }
    
    return details;
  };

  return (
    <div className="bg-purple-900/30 rounded-lg p-6 border border-purple-700/50 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold text-purple-100 mb-2">Event Status</h3>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {event.status === 'finalized' && (
              <div className="flex flex-col sm:flex-row gap-2 ml-2">
                {event.eventDate && (
                  <div className="flex items-center gap-1 text-sm text-purple-300">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                )}
                {event.place && (
                  <div className="flex items-center gap-1 text-sm text-purple-300">
                    <MapPin className="h-4 w-4" />
                    <span>{event.place}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Status action buttons */}
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          {event.status === 'open' && (
            <>
              <Button 
                variant="outline" 
                className="border-yellow-500 text-yellow-300 hover:bg-yellow-900/30 hover:text-yellow-200"
                onClick={() => setIsCloseDialogOpen(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Close Event
              </Button>
              <Button 
                variant="outline" 
                className="border-blue-500 text-blue-300 hover:bg-blue-900/30 hover:text-blue-200"
                onClick={handleFinalizeClick}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalize Event
              </Button>
            </>
          )}
          
          {event.status === 'closed' && (
            <>
              <Button 
                variant="outline" 
                className="border-green-500 text-green-300 hover:bg-green-900/30 hover:text-green-200"
                onClick={() => setIsReopenDialogOpen(true)}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Reopen Event
              </Button>
              <Button 
                variant="outline" 
                className="border-blue-500 text-blue-300 hover:bg-blue-900/30 hover:text-blue-200"
                onClick={handleFinalizeClick}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalize Event
              </Button>
            </>
          )}
          
          {event.status === 'finalized' && (
            <div className="flex items-center gap-2 text-purple-300 bg-purple-800/30 px-4 py-2 rounded-md">
              <CheckCircle className="h-5 w-5 text-blue-400" />
              <span>This event has been finalized and can no longer be modified</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Validation message */}
      {validationMessage && (
        <Alert className="mt-4 bg-amber-900/20 border border-amber-700">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200">
            {validationMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Info message about status */}
      <div className={`mt-2 p-3 rounded-md ${
        event.status === 'open' 
          ? 'bg-green-900/20 border border-green-800/30' 
          : event.status === 'closed'
          ? 'bg-yellow-900/20 border border-yellow-800/30'
          : 'bg-blue-900/20 border border-blue-800/30'
      }`}>
        <div className="flex items-start gap-2">
          {event.status === 'open' && (
            <>
              <AlertCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <p className="text-green-200">
                Your event is <strong>open</strong> for responses. Participants can submit and update their preferences.
              </p>
            </>
          )}
          
          {event.status === 'closed' && (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <p className="text-yellow-200">
                Your event is <strong>closed</strong> for responses. Participants cannot submit or update their preferences.
              </p>
            </>
          )}
          
          {event.status === 'finalized' && (
            <>
              <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <p className="text-blue-200">
                Your event is <strong>finalized</strong>. The event date and location are confirmed and participants can no longer submit responses.
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Close Event Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="bg-purple-950 border-purple-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-purple-100">Close Event</DialogTitle>
            <DialogDescription className="text-purple-300">
              Closing this event will prevent participants from submitting new responses.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-start gap-2 p-3 bg-yellow-900/30 border border-yellow-800/30 rounded-md">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <p className="text-yellow-200">
                Are you sure you want to close "{event.name}"? Participants will not be able to submit or update their responses until you reopen the event.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCloseDialogOpen(false)}
              className="text-purple-200 border-purple-700 hover:bg-purple-900"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
              className="bg-yellow-700 hover:bg-yellow-600 text-white"
            >
              {closeMutation.isPending ? (
                <>Closing...</>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Close Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reopen Event Dialog */}
      <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
        <DialogContent className="bg-purple-950 border-purple-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-purple-100">Reopen Event</DialogTitle>
            <DialogDescription className="text-purple-300">
              Reopening this event will allow participants to submit new responses.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-start gap-2 p-3 bg-green-900/30 border border-green-800/30 rounded-md">
              <AlertCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <p className="text-green-200">
                Are you sure you want to reopen "{event.name}"? Participants will be able to submit and update their responses again.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsReopenDialogOpen(false)}
              className="text-purple-200 border-purple-700 hover:bg-purple-900"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={() => reopenMutation.mutate()}
              disabled={reopenMutation.isPending}
              className="bg-green-700 hover:bg-green-600 text-white"
            >
              {reopenMutation.isPending ? (
                <>Reopening...</>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Reopen Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Finalize Event Dialog */}
      <Dialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
        <DialogContent className="bg-purple-950 border-purple-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-purple-100">Finalize Event</DialogTitle>
            <DialogDescription className="text-purple-300">
              Finalizing this event will confirm the date, location, and prevent further changes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-2 p-3 bg-blue-900/30 border border-blue-800/30 rounded-md">
              <AlertTriangle  className="h-5 w-5 text-blue-400 mt-0.5" />
              <p className="text-blue-200">
                Finalizing "{event.name}" is permanent and cannot be undone. This will set the official date and location for your event.
              </p>
            </div>

            {/* Finalization Summary */}
            <div>
              <h3 className="text-lg font-semibold text-purple-100 mb-3">Event Details Summary</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {getFinalizationSummary()?.map((item, idx) => (
                  <div key={idx} className="bg-purple-800/40 p-3 rounded-md">
                    <div className="font-medium text-purple-200">{item.label}:</div>
                    <div className="text-purple-100 mt-1">{item.value}</div>
                  </div>
                ))}
                
                {!getFinalizationSummary() || getFinalizationSummary()?.length === 0 ? (
                  <div className="bg-amber-900/30 p-3 rounded-md border border-amber-700/50">
                    <p className="text-amber-200 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      No selections have been made. Please select event options in the dashboard.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsFinalizeDialogOpen(false)}
              className="text-purple-200 border-purple-700 hover:bg-purple-900"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending || !getFinalizationSummary() || getFinalizationSummary()?.length === 0}
              className="bg-blue-700 hover:bg-blue-600 text-white"
            >
              {finalizeMutation.isPending ? (
                <>Finalizing...</>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalize Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventStatusManagement;