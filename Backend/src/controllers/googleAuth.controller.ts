// src/controllers/googleAuth.controller.ts
import { Request, Response } from 'express';
import catchErrors from '../utils/catchErrors';
import { 
  getGoogleAuthUrl, 
  getGoogleTokens, 
  storeUserGoogleTokens,
  createCalendarEvent,
  getUserGoogleTokens,
  revokeGoogleAccess 
} from '../services/googleAuth.service';
import { OK, BAD_REQUEST } from '../constants/http';
import appAssert from '../utils/appAssert';
import { APP_ORIGIN } from '../constants/env';

export const getAuthUrlHandler = catchErrors(async (req: Request, res: Response) => {
  const userId = req.userId.toString();
  const authUrl = getGoogleAuthUrl(userId);
  
  return res.status(OK).json({
    status: 'success',
    data: { authUrl }
  });
});

export const handleCallbackHandler = catchErrors(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  
  if (error) {
    // Redirect to frontend with error
    return res.redirect(`${APP_ORIGIN}/calendar-auth?error=${encodeURIComponent(error as string)}`);
  }
  
  appAssert(code, BAD_REQUEST, 'Authorization code is required');
  appAssert(state, BAD_REQUEST, 'User state is required');
  
  try {
    const tokens = await getGoogleTokens(code as string);
    await storeUserGoogleTokens(state as string, tokens);
    
    // Redirect to frontend with success
    return res.redirect(`${APP_ORIGIN}/calendar-auth?success=true`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return res.redirect(`${APP_ORIGIN}/calendar-auth?error=${encodeURIComponent('Authentication failed')}`);
  }
});

export const createEventHandler = catchErrors(async (req: Request, res: Response) => {
  const userId = req.userId.toString();
  const { eventData } = req.body;
  
  appAssert(eventData, BAD_REQUEST, 'Event data is required');
  appAssert(eventData.summary, BAD_REQUEST, 'Event title is required');
  appAssert(eventData.start, BAD_REQUEST, 'Event start time is required');
  
  const calendarEvent = await createCalendarEvent(userId, eventData);
  
  return res.status(OK).json({
    status: 'success',
    data: { 
      event: calendarEvent,
      message: 'Event successfully added to Google Calendar'
    }
  });
});

export const getAuthStatusHandler = catchErrors(async (req: Request, res: Response) => {
  const userId = req.userId.toString();
  const tokens = await getUserGoogleTokens(userId);
  
  return res.status(OK).json({
    status: 'success',
    data: { 
      isAuthenticated: !!tokens?.access_token,
      hasRefreshToken: !!tokens?.refresh_token
    }
  });
});

export const revokeAccessHandler = catchErrors(async (req: Request, res: Response) => {
  const userId = req.userId.toString();
  await revokeGoogleAccess(userId);
  
  return res.status(OK).json({
    status: 'success',
    data: { message: 'Google Calendar access revoked successfully' }
  });
});