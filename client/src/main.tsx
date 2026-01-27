import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * Global error handler for unhandled errors
 * Prevents white screen by gracefully handling crashes
 */
window.addEventListener('error', (event) => {
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
});

/**
 * Root Error Boundary
 * Catches React component errors and displays a recovery UI
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong.</h1>
            <p className="text-gray-600 mt-2">The application encountered an unexpected error.</p>
            <button
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
