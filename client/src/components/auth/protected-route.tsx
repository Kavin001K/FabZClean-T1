import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../contexts/auth-context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
}) => {
  // ✅ ALL HOOKS MUST BE CALLED FIRST, BEFORE ANY CONDITIONAL RETURNS
  const { employee, loading, hasRole } = useAuth();
  const [location, setLocation] = useLocation();

  // Check if employee is authenticated
  const isAuthenticated = !!employee;

  // ✅ useEffect must be called unconditionally, before any early returns
  useEffect(() => {
    // Don't redirect while loading
    if (loading) {
      return;
    }

    // Check if authentication is required
    if (requireAuth && !isAuthenticated) {
      setLocation(`/login?redirect=${encodeURIComponent(location)}`);
      return;
    }

    // Check if employee has required role
    if (allowedRoles && allowedRoles.length > 0 && isAuthenticated && !hasRole(allowedRoles)) {
      setLocation('/unauthorized');
      return;
    }

    // Check if employee is active
    if (employee && !employee.isActive) {
      setLocation('/account-inactive');
      return;
    }
  }, [requireAuth, isAuthenticated, location, setLocation, allowedRoles, hasRole, employee, loading]);

  // ✅ NOW we can do conditional returns AFTER all hooks
  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render children if redirecting
  if (requireAuth && !isAuthenticated) return null;
  if (allowedRoles && allowedRoles.length > 0 && isAuthenticated && !hasRole(allowedRoles)) return null;
  if (employee && !employee.isActive) return null;

  return <>{children}</>;
};

