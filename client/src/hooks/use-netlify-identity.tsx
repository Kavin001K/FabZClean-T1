import { useState, useEffect } from 'react';

// Extend the Window interface to include netlifyIdentity
declare global {
  interface Window {
    netlifyIdentity: {
      currentUser: () => any;
      on: (event: string, callback: (user?: any) => void) => void;
      open: () => void;
      close: () => void;
      logout: () => void;
    };
  }
}

interface NetlifyUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export function useNetlifyIdentity() {
  const [user, setUser] = useState<NetlifyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if Netlify Identity is available
    if (!window.netlifyIdentity) {
      console.warn('Netlify Identity is not available');
      setIsLoading(false);
      return;
    }

    // Initialize Netlify Identity
    window.netlifyIdentity.on('init', (user: NetlifyUser | null) => {
      console.log('Netlify Identity initialized');
      setUser(user);
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    // Listen for login events
    window.netlifyIdentity.on('login', (user: NetlifyUser) => {
      console.log('User logged in:', user);
      setUser(user);
      setIsAuthenticated(true);
      // Close the modal after successful login
      window.netlifyIdentity.close();
    });

    // Listen for logout events
    window.netlifyIdentity.on('logout', () => {
      console.log('User logged out');
      setUser(null);
      setIsAuthenticated(false);
    });

    // Check current user status
    const currentUser = window.netlifyIdentity.currentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);

    // Cleanup function
    return () => {
      // Remove event listeners if needed
    };
  }, []);

  const login = () => {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.open();
    }
  };

  const logout = () => {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.logout();
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}
