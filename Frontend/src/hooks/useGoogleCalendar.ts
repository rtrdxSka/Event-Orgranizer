// src/hooks/useGoogleCalendar.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getGoogleAuthUrl, 
  getGoogleAuthStatus, 
  createGoogleCalendarEvent,
  revokeGoogleAccess,
  formatEventDateTime
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
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Check authentication status
  const { 
    data: authStatus, 
    isLoading: isCheckingAuth,
    refetch: refetchAuthStatus 
  } = useQuery({
    queryKey: ['googleAuthStatus'],
    queryFn: getGoogleAuthStatus,
    retry: false,
    refetchOnWindowFocus: false,
    onError: (error: any) => {
      console.error('Error checking Google auth status:', error);
    }
  });

  // Safe state updates - only update if component is still mounted
  const safeSetAuthWindow = useCallback((window: Window | null) => {
    if (isMountedRef.current) {
      setAuthWindow(window);
    }
  }, []);

  const safeRefetchAuthStatus = useCallback(() => {
    if (isMountedRef.current) {
      refetchAuthStatus();
    }
  }, [refetchAuthStatus]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (authWindow && !authWindow.closed) {
      try {
        authWindow.close();
      } catch (error) {
        // Ignore errors when closing popup
        console.warn('Could not close auth window:', error);
      }
    }
    safeSetAuthWindow(null);
  }, [authWindow, safeSetAuthWindow]);

  // Listen for auth completion with better error handling
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Ensure we only handle messages from our own origin
      if (event.origin !== window.location.origin) return;
      
      // Check if component is still mounted
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
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [safeRefetchAuthStatus, cleanup]);

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
        
        safeSetAuthWindow(popup);
        
        // Check if popup is closed manually by user
        intervalRef.current = setInterval(() => {
          try {
            if (!isMountedRef.current) {
              cleanup();
              return;
            }
            
            if (popup.closed) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              safeSetAuthWindow(null);
            }
          } catch (error) {
            // If we can't access the popup (cross-origin), it's likely still open
            // Don't clear the popup reference in this case
            console.warn('Unable to check popup status - this is normal during auth flow');
          }
        }, 1000);
        
        return popup;
      } catch (error) {
        cleanup();
        throw error;
      }
    },
    onError: (error: any) => {
      if (isMountedRef.current) {
        toast.error('Authentication failed: ' + error.message);
      }
      cleanup();
    }
  });

  // Create calendar event
  const { mutate: addToCalendar, isPending: isAddingToCalendar } = useMutation({
    mutationFn: async (eventData: EventData) => {
      // Check if authenticated
      if (!authStatus?.isAuthenticated) {
        throw new Error('Not authenticated with Google Calendar');
      }

      const { start, end } = formatEventDateTime(
        eventData.startDate, 
        eventData.endDate ? 
          (new Date(eventData.endDate).getTime() - new Date(eventData.startDate).getTime()) / (1000 * 60 * 60) : 
          2 // Default 2 hours
      );

      return createGoogleCalendarEvent({
        summary: eventData.title,
        description: eventData.description,
        start: eventData.endDate ? eventData.startDate : start,
        end: eventData.endDate || end,
        location: eventData.location,
        timeZone: eventData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    },
    onSuccess: (data) => {
      if (!isMountedRef.current) return;
      
      toast.success('Event added to Google Calendar!');
      
      // Optional: Open Google Calendar to show the event
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
    onError: (error: any) => {
      if (!isMountedRef.current) return;
      
      console.error('Calendar event creation error:', error);
      
      if (error.message?.includes('Not authenticated')) {
        toast.error('Please connect your Google Calendar first');
      } else if (error.message?.includes('401') || error.status === 401) {
        toast.error('Google Calendar access expired. Please reconnect.');
        // Automatically try to refresh auth status
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
    onError: (error: any) => {
      if (!isMountedRef.current) return;
      
      toast.error('Failed to disconnect: ' + (error.message || 'Unknown error'));
    }
  });

  // Main function to add event to calendar
  const handleAddToGoogleCalendar = useCallback(async (eventData: EventData) => {
    if (!isMountedRef.current) return;
    
    try {
      if (!authStatus?.isAuthenticated) {
        // Store event data for after authentication
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
          // Add a small delay to ensure the UI has updated
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

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