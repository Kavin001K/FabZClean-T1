import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { isSupabaseConfigured, SupabaseAuthService, AuthEmployee } from '../lib/supabase-auth';

// Define all valid roles
export type EmployeeRole = 'admin' | 'franchise_manager' | 'factory_manager' | 'employee' | 'driver' | 'manager' | 'staff';

interface Employee {
  id: string;
  employeeId: string;
  username: string;
  role: EmployeeRole | string;
  franchiseId?: string;
  factoryId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  position?: string;
  department?: string;
  hireDate?: string;
  salaryType?: 'hourly' | 'monthly';
  baseSalary?: number;
  hourlyRate?: number;
  workingHours?: number;
  emergencyContact?: string;
  qualifications?: string;
  notes?: string;
  address?: string;
  settings?: any;
  profileImage?: string;
}

interface AuthContextType {
  employee: Employee | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null; employee?: Employee }>;
  signOut: () => Promise<void>;
  refreshEmployee: () => Promise<void>;
  hasRole: (roles: string | string[]) => boolean;
  isAdmin: boolean;
  isFranchiseManager: boolean;
  isFactoryManager: boolean;
  sessionTimeRemaining: number;
  showSessionWarning: boolean;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session configuration
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_LOGOUT = 5 * 60 * 1000; // Show warning 5 minutes before logout

// Get API base URL - always use backend when available
const getApiBase = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && apiUrl.startsWith('http')) {
    return apiUrl;
  }
  return '/api';
};

// Check if we should use direct Supabase (only in production without backend)
const shouldUseDirectSupabase = (): boolean => {
  if (typeof window === 'undefined') return false;

  // If VITE_API_URL is set, always use backend
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return false;

  // Only use Supabase in production mode when it's configured
  if (import.meta.env.PROD && isSupabaseConfigured) {
    return true;
  }

  return false;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(SESSION_DURATION / 1000);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const useDirectSupabase = shouldUseDirectSupabase();
  const apiBase = getApiBase();

  // Fetch current employee from API
  const fetchEmployee = useCallback(async (token: string): Promise<boolean> => {
    try {
      if (useDirectSupabase) {
        // Use direct Supabase auth (only in production without backend)
        const emp = await SupabaseAuthService.verifySession(token);
        if (emp) {
          setEmployee(emp as Employee);
          return true;
        }
        return false;
      }

      // Use backend API (default for local development)
      const response = await fetch(`${apiBase}/auth/me`, {
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
  }, [useDirectSupabase, apiBase]);

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem('employee_token');

    if (token && !useDirectSupabase) {
      try {
        await fetch(`${apiBase}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Ignore logout errors
      }
    }

    localStorage.removeItem('employee_token');
    localStorage.removeItem('session_start');

    // Clear all timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setEmployee(null);
    setShowSessionWarning(false);
    setSessionTimeRemaining(SESSION_DURATION / 1000);
  }, [useDirectSupabase, apiBase]);

  // Reset session timers
  const resetSessionTimers = useCallback(() => {
    if (!employee) return;

    lastActivityRef.current = Date.now();
    localStorage.setItem('session_start', Date.now().toString());
    setShowSessionWarning(false);
    setSessionTimeRemaining(SESSION_DURATION / 1000);

    // Clear existing timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Set warning timer (5 minutes before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowSessionWarning(true);

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setSessionTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, SESSION_DURATION - WARNING_BEFORE_LOGOUT);

    // Set logout timer
    logoutTimerRef.current = setTimeout(() => {
      console.log('Session expired due to inactivity');
      signOut();
    }, SESSION_DURATION);
  }, [employee, signOut]);

  // Extend session (called when user clicks "Stay Logged In")
  const extendSession = useCallback(() => {
    resetSessionTimers();
  }, [resetSessionTimers]);

  // Track user activity
  useEffect(() => {
    if (!employee) return;

    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Only reset if more than 1 second since last activity (debounce)
      if (timeSinceLastActivity > 1000) {
        resetSessionTimers();
      }
    };

    // Events to track activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    // Debounced activity handler
    let activityTimeout: NodeJS.Timeout | null = null;
    const debouncedActivity = () => {
      if (activityTimeout) clearTimeout(activityTimeout);
      activityTimeout = setTimeout(handleActivity, 100);
    };

    // Initial session timer setup
    resetSessionTimers();

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, debouncedActivity, { passive: true });
    });

    return () => {
      if (activityTimeout) clearTimeout(activityTimeout);
      activityEvents.forEach(event => {
        window.removeEventListener(event, debouncedActivity);
      });
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [employee, resetSessionTimers]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('employee_token');
      const sessionStart = localStorage.getItem('session_start');

      if (token) {
        // Check if session has expired
        if (sessionStart) {
          const elapsed = Date.now() - parseInt(sessionStart);
          if (elapsed > SESSION_DURATION) {
            // Session expired, clean up
            localStorage.removeItem('employee_token');
            localStorage.removeItem('session_start');
            setEmployee(null);
            setLoading(false);
            return;
          }
        }

        const isValid = await fetchEmployee(token);
        if (!isValid) {
          // Token invalid, remove it
          localStorage.removeItem('employee_token');
          localStorage.removeItem('session_start');
          setEmployee(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [fetchEmployee]);

  // Sign in with username and password
  const signIn = async (username: string, password: string): Promise<{ error: string | null; employee?: Employee }> => {
    setLoading(true);
    try {
      if (useDirectSupabase) {
        // Use direct Supabase auth (only in production without backend)
        const result = await SupabaseAuthService.login(username, password);
        localStorage.setItem('employee_token', result.token);
        localStorage.setItem('session_start', Date.now().toString());
        setEmployee(result.employee as Employee);
        return { error: null, employee: result.employee as Employee };
      }

      // Use backend API (default)
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('employee_token', data.token);
        localStorage.setItem('session_start', Date.now().toString());
        setEmployee(data.employee);
        return { error: null, employee: data.employee };
      } else {
        return { error: data.error || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: error.message || 'Login failed. Please check your connection.' };
    } finally {
      setLoading(false);
    }
  };

  // Check if employee has specific role(s)
  // Admin always has access to all pages
  const hasRole = (roles: string | string[]): boolean => {
    if (!employee) return false;
    // Admin has access to everything
    if (employee.role === 'admin') return true;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(employee.role);
  };

  // Role-specific computed properties
  const isAdmin = employee?.role === 'admin';
  const isFranchiseManager = employee?.role === 'franchise_manager';
  const isFactoryManager = employee?.role === 'factory_manager';

  // Refresh employee data (for profile updates)
  const refreshEmployee = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem('employee_token');
    if (token) {
      await fetchEmployee(token);
    }
  }, [fetchEmployee]);

  const value: AuthContextType = {
    employee,
    loading,
    signIn,
    signOut,
    refreshEmployee,
    hasRole,
    isAdmin,
    isFranchiseManager,
    isFactoryManager,
    sessionTimeRemaining,
    showSessionWarning,
    extendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
