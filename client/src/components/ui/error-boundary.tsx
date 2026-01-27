import React from 'react';
import { ErrorFallback } from './error-fallback';
import { isChunkLoadError, handleChunkLoadError } from '@/lib/dynamic-import';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorCount: number;
  lastErrorTime?: number;
  isChunkError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const isChunkError = isChunkLoadError(error);
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
      isChunkError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { errorCount } = this.state;
    const newErrorCount = errorCount + 1;
    const isChunkError = isChunkLoadError(error);

    // Log error details
    console.error('Error caught by boundary:', error, errorInfo);

    // If it's a chunk loading error, try to recover automatically
    if (isChunkError) {
      console.warn('[ErrorBoundary] Detected chunk loading error, attempting recovery...');
      try {
        handleChunkLoadError(error);
        return; // Page will refresh, no need to continue
      } catch {
        // handleChunkLoadError might re-throw if recovery isn't possible
        console.error('[ErrorBoundary] Could not recover from chunk loading error');
      }
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorCount: newErrorCount,
      isChunkError,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Prevent cascading failures - if too many errors in short time, show fallback
    if (newErrorCount >= 3) {
      console.error('Too many errors detected. Preventing cascading failure.');
    }

    // Report error to monitoring service (if available)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        (window as any).Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack
            }
          }
        });
      } catch (reportingError) {
        // Ignore reporting errors
      }
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError, lastErrorTime } = this.state;

    // Reset error state when resetKeys change (allowing recovery)
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) =>
        key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetError();
      }
    }

    // Auto-reset after 30 seconds if error was transient
    if (hasError && lastErrorTime && Date.now() - lastErrorTime > 30000) {
      // Clear any existing timeout
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId);
      }

      // Auto-reset after delay to prevent permanent failure state
      this.resetTimeoutId = setTimeout(() => {
        if (this.state.hasError) {
this.resetError();
        }
      }, 5000);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      isChunkError: false,
      // Keep errorCount for tracking, but reset to prevent permanent block
      errorCount: Math.max(0, this.state.errorCount - 1)
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorCount, isChunkError } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      // Special handling for chunk loading errors
      if (isChunkError) {
        return (
          <ErrorFallback
            error={error}
            resetError={this.handleRefresh}
            title="Application Update Required"
            message="A new version of the application is available. Please refresh the page to continue."
            showRetry={true}
          />
        );
      }

      // If too many errors, show a more serious fallback
      if (errorCount >= 5) {
        return (
          <ErrorFallback
            error={error}
            resetError={this.resetError}
            title="Application Error"
            message="Multiple errors detected. Please refresh the page. If the problem persists, contact support."
            showRetry={true}
          />
        );
      }

      // Use custom fallback if provided
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent error={error} resetError={this.resetError} />;
      }

      // Default fallback
      return <ErrorFallback error={error} resetError={this.resetError} />;
    }

    return children;
  }
}

export default ErrorBoundary;
