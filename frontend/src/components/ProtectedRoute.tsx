import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, loading } = useAuth();

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-background font-sans text-sm text-muted">Loading session...</main>;
  }
  return token ? children : <Navigate to="/login" replace />;
}