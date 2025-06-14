// src/services/googleAuth.service.ts
import { google } from 'googleapis';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BACKEND_URL } from '../constants/env';
import UserModel from '../models/user.model';
import appAssert from '../utils/appAssert';
import { NOT_FOUND, INTERNAL_SERVER_ERROR } from '../constants/http';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${BACKEND_URL}/auth/google/callback`
);

export const getGoogleAuthUrl = (userId: string) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: userId // Pass userId to identify user after callback
  });
};

export const getGoogleTokens = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const storeUserGoogleTokens = async (userId: string, tokens: any) => {
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");
  appAssert(tokens.access_token, INTERNAL_SERVER_ERROR, "Access token is required");

  // Store tokens in user document (might want to encrypt these)
  user.googleTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || undefined,
    expiry_date: tokens.expiry_date || undefined,
    token_type: tokens.token_type || undefined,
    scope: tokens.scope || undefined
  };

  await user.save();
  return user;
};

export const getUserGoogleTokens = async (userId: string) => {
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");
  
  return user.googleTokens || null;
};

export const refreshGoogleToken = async (userId: string) => {
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");
  appAssert(user.googleTokens?.refresh_token, INTERNAL_SERVER_ERROR, "No refresh token available");

  oauth2Client.setCredentials({
    refresh_token: user.googleTokens.refresh_token
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  
  appAssert(credentials.access_token, INTERNAL_SERVER_ERROR, "Failed to refresh access token");
  
  // Update stored tokens
  user.googleTokens = {
    ...user.googleTokens,
    access_token: credentials.access_token,
    expiry_date: credentials.expiry_date || undefined
  };

  await user.save();
  return credentials;
};

interface CalendarEventData {
  summary: string;
  description: string;
  start: string;
  end: string;
  location?: string;
  timeZone?: string;
}

export const createCalendarEvent = async (userId: string, eventData: CalendarEventData): Promise<any> => {
  let tokens = await getUserGoogleTokens(userId);
  appAssert(tokens, INTERNAL_SERVER_ERROR, "No Google Calendar access. Please authenticate first.");

  // Check if token is expired and refresh if needed
  if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
    const refreshedCredentials = await refreshGoogleToken(userId);
    // Get the updated tokens from the user after refresh
    tokens = await getUserGoogleTokens(userId);
    appAssert(tokens, INTERNAL_SERVER_ERROR, "Failed to get updated tokens after refresh.");
  }

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token
  });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // Calculate end time if not provided (default to 2 hours after start)
  let endDateTime = eventData.end;
  if (!endDateTime) {
    const startDate = new Date(eventData.start);
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours
    endDateTime = endDate.toISOString();
  }

  const event = {
    summary: eventData.summary,
    description: eventData.description,
    start: {
      dateTime: eventData.start,
      timeZone: eventData.timeZone || 'UTC',
    },
    end: {
      dateTime: endDateTime,
      timeZone: eventData.timeZone || 'UTC',
    },
    location: eventData.location,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 }, // 30 minutes before
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data;
  } catch (error: any) {
    console.error('Google Calendar API Error:', error);
    
    if (error.code === 401) {
      // Token might be invalid, try to refresh and retry once
      await refreshGoogleToken(userId);
      const updatedTokens = await getUserGoogleTokens(userId);
      appAssert(updatedTokens, INTERNAL_SERVER_ERROR, "Failed to get updated tokens after refresh.");
      
      oauth2Client.setCredentials({
        access_token: updatedTokens.access_token,
        refresh_token: updatedTokens.refresh_token
      });
      
      // Retry the request once
      const retryResponse = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      
      return retryResponse.data;
    }
    
    throw error;
  }
};

export const revokeGoogleAccess = async (userId: string) => {
  const tokens = await getUserGoogleTokens(userId);
  
  if (tokens?.access_token) {
    try {
      await oauth2Client.revokeToken(tokens.access_token);
    } catch (error) {
      console.error('Error revoking Google token:', error);
    }
  }

  // Remove tokens from user document
  const user = await UserModel.findById(userId);
  if (user) {
    user.googleTokens = undefined;
    await user.save();
  }
};