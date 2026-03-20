import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <div className="text-muted">Đang tải...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
