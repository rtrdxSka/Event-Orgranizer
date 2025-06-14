// src/routes/googleAuth.route.ts
import { Router } from 'express';
import { 
  getAuthUrlHandler, 
  handleCallbackHandler, 
  createEventHandler,
  getAuthStatusHandler,
  revokeAccessHandler
} from '../controllers/googleAuth.controller';
import authenticate from '../middleware/authenticate';

const googleAuthRoutes = Router();

// Get Google auth URL (requires authentication)
googleAuthRoutes.get('/auth-url', authenticate, getAuthUrlHandler);

// Handle OAuth callback (no auth required as user is redirected from Google)
googleAuthRoutes.get('/google/callback', handleCallbackHandler);

// Create calendar event (requires authentication)
googleAuthRoutes.post('/create-event', authenticate, createEventHandler);

// Check auth status (requires authentication)
googleAuthRoutes.get('/auth-status', authenticate, getAuthStatusHandler);

// Revoke Google access (requires authentication)
googleAuthRoutes.delete('/revoke', authenticate, revokeAccessHandler);

export default googleAuthRoutes;