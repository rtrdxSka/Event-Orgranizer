// src/pages/GoogleAuthCallback.tsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const GoogleAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('');

  useEffect(() => {
    const handleCallback = () => {
      const success = searchParams.get('success');
      const error = searchParams.get('error');

      if (success === 'true') {
        setStatus('success');
        setMessage('Google Calendar connected successfully!');
        
        // Notify parent window (if opened in popup)
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'GOOGLE_AUTH_SUCCESS' 
          }, window.location.origin);
          
          // Close popup after short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      } else if (error) {
        setStatus('error');
        setMessage(decodeURIComponent(error));
        
        // Notify parent window (if opened in popup)
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'GOOGLE_AUTH_ERROR',
            error: decodeURIComponent(error)
          }, window.location.origin);
          
          // Close popup after delay
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      } else {
        setStatus('error');
        setMessage('Unknown error occurred during authentication');
      }
    };

    // Small delay to ensure URL params are loaded
    setTimeout(handleCallback, 100);
  }, [searchParams]);

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      // If not in popup, redirect to home
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-purple-950 flex items-center justify-center p-4">
      <Card className="bg-purple-900/40 border-purple-700/50 w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-purple-100">
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-purple-300 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-purple-100 mb-2">
                  Connecting...
                </h3>
                <p className="text-purple-200">
                  Please wait while we complete the authentication.
                </p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-purple-100 mb-2">
                  Success!
                </h3>
                <p className="text-purple-200 mb-4">{message}</p>
                <p className="text-purple-300 text-sm">
                  This window will close automatically...
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-purple-100 mb-2">
                  Authentication Failed
                </h3>
                <p className="text-red-300 mb-4">{message}</p>
                <Button 
                  onClick={handleClose}
                  className="bg-purple-600 hover:bg-purple-500"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleAuthCallback;