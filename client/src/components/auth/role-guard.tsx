import React from 'react';
import { useAuth } from '../../contexts/auth-context';
import { UserRole } from '../../types/supabase';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 * Useful for hiding/showing UI elements based on permissions
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = null,
}) => {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

