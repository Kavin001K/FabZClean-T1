import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { ROLE_NAV_ACCESS, LOGIN_ROLES } from '../../../../shared/schema';
import type { SystemRole } from '../../../../shared/schema';

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

    // ---- RBAC Role-Based Routing ----
    if (employee) {
      const role = employee.role as SystemRole;

      // Factory Staff: NO LOGIN — redirect to unauthorized
      if (role === 'factory_staff') {
        setLocation('/unauthorized');
        return;
      }

      // Driver role is disabled in active UI flow.
      if (role === 'driver') {
        setLocation('/unauthorized');
        return;
      }

      // All other roles: Check nav access matrix
      const allowed = ROLE_NAV_ACCESS[role];
      if (allowed && allowed.length > 0) {
        const isAllowed = allowed.some(p => location === p || location.startsWith(p + '/'));
        if (!isAllowed) {
          // Redirect to their default home
          setLocation(allowed[0] || '/');
          return;
        }
      }
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
