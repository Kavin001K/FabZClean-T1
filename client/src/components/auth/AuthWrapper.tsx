import { useEffect, useState, ReactNode } from 'react';

// Extend the Window interface to include netlifyIdentity
declare global {
  interface Window {
    netlifyIdentity?: {
      init: () => void;
      open: () => void;
      close: () => void;
      currentUser: () => any;
      on: (event: string, callback: (user?: any) => void) => void;
      off: (event: string, callback: (user?: any) => void) => void;
    };
  }
}

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Netlify Identity
    if (window.netlifyIdentity) {
      window.netlifyIdentity.init();

      // Check if user is already logged in
      const currentUser = window.netlifyIdentity.currentUser();
      if (currentUser) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        // If no user is logged in, open the login modal
        window.netlifyIdentity.open();
        setIsLoading(false);
      }

      // Listen for login events
      const handleLogin = (user: any) => {
        if (user) {
          setIsAuthenticated(true);
          window.netlifyIdentity?.close();
        }
      };

      // Listen for logout events
      const handleLogout = () => {
        setIsAuthenticated(false);
        window.netlifyIdentity?.open();
      };

      // Listen for close events (when user closes modal without logging in)
      const handleClose = () => {
        if (!window.netlifyIdentity?.currentUser()) {
          // If user closes modal without logging in, keep showing login
          setTimeout(() => {
            window.netlifyIdentity?.open();
          }, 100);
        }
      };

      window.netlifyIdentity.on('login', handleLogin);
      window.netlifyIdentity.on('logout', handleLogout);
      window.netlifyIdentity.on('close', handleClose);

      // Cleanup event listeners
      return () => {
        window.netlifyIdentity?.off('login', handleLogin);
        window.netlifyIdentity?.off('logout', handleLogout);
        window.netlifyIdentity?.off('close', handleClose);
      };
    } else {
      // If Netlify Identity is not available, show error
      console.error('Netlify Identity is not available');
      setIsLoading(false);
    }
  }, []);

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome to FabZClean
            </h1>
            <p className="text-muted-foreground">
              Please log in to access the application
            </p>
          </div>
          <button
            onClick={() => window.netlifyIdentity?.open()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Open Login
          </button>
        </div>
      </div>
    );
  }

  // Render the main application if authenticated
  return <>{children}</>;
}
