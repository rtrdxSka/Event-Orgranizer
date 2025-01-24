import useAuth from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';

export const GuestRoute = ({ children }) => {
  // Disable the auth check for guest routes
  const { user, isLoading } = useAuth({ enabled: false });
  const location = useLocation();

  // User will always be undefined since we disabled the query
  // This prevents the infinite requests
  if (user) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
};