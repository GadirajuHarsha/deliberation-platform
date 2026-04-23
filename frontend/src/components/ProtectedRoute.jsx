import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  if (!currentUser && !isDemo) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}
