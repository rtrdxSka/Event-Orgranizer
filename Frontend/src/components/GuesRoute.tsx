// GuestRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import useAuth from '@/hooks/useAuth';

export const GuestRoute = ({ children }: PropsWithChildren) => {
  // With enabled: false, the query won't run, so we don't need to handle loading state
  const { user } = useAuth({ enabled: false });
  const location = useLocation();

  // If somehow we have a user, redirect them
  if (user) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // Otherwise, show the guest content
  return children;
};