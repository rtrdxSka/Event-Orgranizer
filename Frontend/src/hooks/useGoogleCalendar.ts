// src/hooks/useGoogleCalendar.ts
import {  useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getGoogleAuthUrl, 
  getGoogleAuthStatus, 
  createGoogleCalendarEvent,
  revokeGoogleAccess,
} from '@/lib/googleCalendar';
import { toast } from 'sonner';

interface EventData {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  timeZone?: string;
}

export const useGoogleCalendar = () => {
  const queryClient = useQueryClient();
  // Remove authWindow from state - use ref instead to avoid React trying to access window properties
  const authWindowRef = useRef<Window | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const eventListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check authentication status
const { 
  data: authStatus, 
  isLoading: isCheckingAuth,
  refetch: refetchAuthStatus,
  isError,
  error
} = useQuery({
  queryKey: ['googleAuthStatus'],
  queryFn: getGoogleAuthStatus,
  retry: false,
  refetchOnWindowFocus: false,
});

// Add this useEffect to handle the error logging
useEffect(() => {
  if (isError && error) {
    console.error('Error checking Google auth status:', error);
  }
}, [isError, error]);

  const safeRefetchAuthStatus = useCallback(() => {
    if (isMountedRef.current) {
      refetchAuthStatus();
    }
  }, [refetchAuthStatus]);

  // Cleanup function - now using ref instead of state
const cleanup = useCallback(() => {
  // Clear timeout instead of interval
  if (intervalRef.current) {
    clearTimeout(intervalRef.current);
    intervalRef.current = null;
  }
  
  // Remove event listener
  if (eventListenerRef.current) {
    window.removeEventListener('message', eventListenerRef.current);
    eventListenerRef.current = null;
  }
  
  // Close auth window without checking its properties
  if (authWindowRef.current) {
    try {
      // Just try to close without checking if it's already closed
      authWindowRef.current.close();
    } catch {
      // Ignore all errors when closing popup
      console.log('Could not close popup (this is normal if popup is on different domain)');
    }
    authWindowRef.current = null;
  }
}, []);

  // Message handler
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (!isMountedRef.current) return;
    
    try {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        toast.success('Google Calendar connected successfully!');
        safeRefetchAuthStatus();
        cleanup();
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        toast.error('Failed to connect Google Calendar: ' + (event.data.error || 'Unknown error'));
        cleanup();
      }
    } catch (error) {
      console.error('Error handling auth message:', error);
      cleanup();
    }
  }, [safeRefetchAuthStatus, cleanup]);

  // Set up and cleanup event listener
  useEffect(() => {
    // Remove any existing listener first
    if (eventListenerRef.current) {
      window.removeEventListener('message', eventListenerRef.current);
    }
    
    // Add new listener
    eventListenerRef.current = handleMessage;
    window.addEventListener('message', handleMessage);
    
    return () => {
      if (eventListenerRef.current) {
        window.removeEventListener('message', eventListenerRef.current);
        eventListenerRef.current = null;
      }
    };
  }, [handleMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (eventListenerRef.current) {
        window.removeEventListener('message', eventListenerRef.current);
        eventListenerRef.current = null;
      }
      if (authWindowRef.current) {
        try {
          authWindowRef.current.close();
        } catch  {
          // Ignore errors
        }
        authWindowRef.current = null;
      }
    };
  }, []);

  // Authenticate with Google
  const { mutate: authenticate, isPending: isAuthenticating } = useMutation({
  mutationFn: async () => {
    try {
      const authUrl = await getGoogleAuthUrl();
      
      // Clean up any existing popup first
      cleanup();
      
      // Open popup window for authentication
      const popup = window.open(
        authUrl, 
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes,left=' + 
        (window.screen.width / 2 - 250) + ',top=' + 
        (window.screen.height / 2 - 300)
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
      
      // Store in ref instead of state
      authWindowRef.current = popup;
      
      // Set up a timeout to cleanup after 5 minutes (auth should complete well before this)
      // We rely entirely on the message listener for successful auth completion
      intervalRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        // Clean up after timeout - user probably abandoned the auth flow
        cleanup();
        toast.error('Authentication timed out. Please try again.');
      }, 5 * 60 * 1000); // 5 minutes
      
      return popup;
    } catch (error) {
      cleanup();
      throw error;
    }
  },
  onError: (error: Error) => {
    if (isMountedRef.current) {
      toast.error('Authentication failed: ' + error.message);
    }
    cleanup();
  }
});

  // Create calendar event
  const { mutate: addToCalendar, isPending: isAddingToCalendar } = useMutation({
    mutationFn: async (eventData: EventData) => {
      if (!authStatus?.isAuthenticated) {
        throw new Error('Not authenticated with Google Calendar');
      }

      const calendarEventData = {
        summary: eventData.title,
        description: eventData.description,
        start: eventData.startDate,
        end: eventData.endDate,
        location: eventData.location,
        timeZone: eventData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      return createGoogleCalendarEvent(calendarEventData);
    },
    onSuccess: (data) => {
      if (!isMountedRef.current) return;
      
      toast.success('Event added to Google Calendar!');
      
      if (data?.event?.htmlLink) {
        setTimeout(() => {
          if (isMountedRef.current) {
            const openCalendar = window.confirm('Event added! Would you like to view it in Google Calendar?');
            if (openCalendar) {
              window.open(data.event.htmlLink, '_blank');
            }
          }
        }, 500);
      }
    },
    onError: (error: Error & { status?: number }) => {
      if (!isMountedRef.current) return;
      
      if (error.message?.includes('Not authenticated')) {
        toast.error('Please connect your Google Calendar first');
      } else if (error.message?.includes('401') || error.status === 401) {
        toast.error('Google Calendar access expired. Please reconnect.');
        safeRefetchAuthStatus();
      } else {
        toast.error('Failed to add event to calendar: ' + (error.message || 'Unknown error'));
      }
    }
  });

  // Revoke access
  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: revokeGoogleAccess,
    onSuccess: () => {
      if (!isMountedRef.current) return;
      
      toast.success('Google Calendar disconnected');
      queryClient.invalidateQueries({ queryKey: ['googleAuthStatus'] });
    },
    onError: (error: Error) => {
      if (!isMountedRef.current) return;
      
      toast.error('Failed to disconnect: ' + (error.message || 'Unknown error'));
    }
  });

  // Main function to add event to calendar
  const handleAddToGoogleCalendar = useCallback(async (eventData: EventData) => {
    if (!isMountedRef.current) {
      return;
    }
    
    try {
      if (!authStatus?.isAuthenticated) {
        sessionStorage.setItem('pendingCalendarEvent', JSON.stringify(eventData));
        authenticate();
        return;
      }

      addToCalendar(eventData);
    } catch (error) {
      console.error('Error in handleAddToGoogleCalendar:', error);
      if (isMountedRef.current) {
        toast.error('Failed to process calendar request');
      }
    }
  }, [authStatus?.isAuthenticated, authenticate, addToCalendar]);

  // Check for pending event after authentication
  useEffect(() => {
    if (authStatus?.isAuthenticated && isMountedRef.current) {
      try {
        const pendingEvent = sessionStorage.getItem('pendingCalendarEvent');
        if (pendingEvent) {
          const eventData = JSON.parse(pendingEvent);
          sessionStorage.removeItem('pendingCalendarEvent');
          setTimeout(() => {
            if (isMountedRef.current) {
              addToCalendar(eventData);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error processing pending calendar event:', error);
        sessionStorage.removeItem('pendingCalendarEvent');
      }
    }
  }, [authStatus?.isAuthenticated, addToCalendar]);

  return {
    // State
    isAuthenticated: authStatus?.isAuthenticated || false,
    isCheckingAuth,
    
    // Actions
    authenticate,
    disconnect,
    addToGoogleCalendar: handleAddToGoogleCalendar,
    
    // Loading states
    isAuthenticating,
    isAddingToCalendar,
    isDisconnecting,
    
    // Utils
    refetchAuthStatus: safeRefetchAuthStatus
  };
};