import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

/** Gate for admin routes. Redirects to /admin/login when unauthenticated. */
export const RequireAdmin: React.FC<{ children: React.ReactNode; superOnly?: boolean }> = ({ children, superOnly }) => {
  const { admin, loading, isSuperAdmin } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-comun-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-comun-gold/30 border-t-comun-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (superOnly && !isSuperAdmin) return <Navigate to="/admin" replace />;

  return <>{children}</>;
};
