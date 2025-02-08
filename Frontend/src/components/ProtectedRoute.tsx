// ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from '@/components/Navbar';

export const ProtectedRoute = ({ children }) => {
  const { user, isLoading, isError, error } = useAuth();
  const location = useLocation();

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
              Loading
            </h2>
            <p className="text-purple-200">
              Please wait while we verify your credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    if (error?.status === 401) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
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
              Error
            </h2>
            <p className="text-red-300 mb-8">
              {error?.message || 'An error occurred. Please try again later.'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-purple-200 text-purple-950 hover:bg-purple-100"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};