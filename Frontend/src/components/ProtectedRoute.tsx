

// ProtectedRoute.jsx
import useAuth from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';


export const ProtectedRoute = ({ children }) => {
  const { user, isLoading, isError, error } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Replace with your loading component
  }

  if (isError) {
    // If we get a 401, redirect to login
    if (error?.response?.status === 401) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <div>Error: {error.message}</div>; // Replace with your error component
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};