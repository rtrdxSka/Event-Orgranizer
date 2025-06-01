// src/pages/GoogleCalendarCallback.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const GoogleCalendarCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    // Send message to parent window
    if (window.opener) {
      try {
        if (success === 'true') {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS'
          }, window.location.origin);
        } else {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: error || 'Authentication failed'
          }, window.location.origin);
        }
      } catch (err) {
        console.error('Failed to send message to parent:', err);
      }
    }

    // Close the popup after a short delay
    setTimeout(() => {
      try {
        window.close();
      } catch (err) {
        console.error('Failed to close popup:', err);
      }
    }, 1000);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-purple-950 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-purple-900/40 rounded-xl border border-purple-700/50 text-center">
        <div className="text-purple-100">
          <h2 className="text-xl font-semibold mb-2">
            {searchParams.get('success') === 'true' 
              ? 'Authentication Successful!' 
              : 'Authentication Failed'
            }
          </h2>
          <p className="text-purple-300">
            This window will close automatically...
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;