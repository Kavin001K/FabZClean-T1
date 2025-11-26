import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE as API_BASE_URL } from '../lib/data-service';

interface Employee {
  id: string;
  employeeId: string;
  username: string;
  role: 'admin' | 'franchise_manager' | 'factory_manager';
  franchiseId?: string;
  factoryId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

interface AuthContextType {
  employee: Employee | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (roles: string | string[]) => boolean;
  isAdmin: boolean;
  isFranchiseManager: boolean;
  isFactoryManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current employee from API
  const fetchEmployee = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.employee) {
          setEmployee(data.employee);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return false;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('employee_token');
      if (token) {
        const isValid = await fetchEmployee(token);
        if (!isValid) {
          // Token invalid, remove it
          localStorage.removeItem('employee_token');
          setEmployee(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Sign in with username and password
  const signIn = async (username: string, password: string): Promise<{ error: string | null }> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('employee_token', data.token);
        setEmployee(data.employee);
        return { error: null };
      } else {
        return { error: data.error || 'Login failed' };
      }
    } catch (error: any) {
      return { error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    const token = localStorage.getItem('employee_token');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
      localStorage.removeItem('employee_token');
    }
    setEmployee(null);
  };

  // Check if employee has specific role(s)
  const hasRole = (roles: string | string[]): boolean => {
    if (!employee) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(employee.role);
  };

  // Role-specific computed properties
  const isAdmin = employee?.role === 'admin';
  const isFranchiseManager = employee?.role === 'franchise_manager';
  const isFactoryManager = employee?.role === 'factory_manager';

  const value: AuthContextType = {
    employee,
    loading,
    signIn,
    signOut,
    hasRole,
    isAdmin,
    isFranchiseManager,
    isFactoryManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
