// src/lib/googleCalendar.ts
import API from '@/config/apiClient';
import { GoogleCalendarEventResponse } from '@/types';

interface CalendarEventData {
  summary: string;
  description: string;
  start: string;
  end?: string;
  location?: string;
  timeZone?: string;
}

interface GoogleAuthStatus {
  isAuthenticated: boolean;
  hasRefreshToken: boolean;
}

export const getGoogleAuthUrl = async (): Promise<string> => {
  const response = await API.get('/auth/auth-url');
  return response.data.authUrl;
};

export const getGoogleAuthStatus = async (): Promise<GoogleAuthStatus> => {
  const response = await API.get('/auth/auth-status');
  return response.data;
};

export const createGoogleCalendarEvent = async (eventData: CalendarEventData): Promise<GoogleCalendarEventResponse > => {
  const response = await API.post('/auth/create-event', { eventData });
  return response.data;
};

export const revokeGoogleAccess = async (): Promise<void> => {
  await API.delete('/auth/revoke');
};

// Helper function to format date for calendar event
export const formatEventDateTime = (dateString: string, addHours: number = 2): { start: string; end: string } => {
  const startDate = new Date(dateString);
  const endDate = new Date(startDate.getTime() + (addHours * 60 * 60 * 1000));
  
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
};