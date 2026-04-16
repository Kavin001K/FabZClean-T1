import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";


const syncViewportVariables = () => {
  const visualHeight = window.visualViewport?.height || window.innerHeight;
  const visualWidth = window.visualViewport?.width || window.innerWidth;

  document.documentElement.style.setProperty('--app-vh', `${window.innerHeight * 0.01}px`);
  document.documentElement.style.setProperty('--app-dvh', `${visualHeight * 0.01}px`);
  document.documentElement.style.setProperty('--app-vw', `${visualWidth * 0.01}px`);
};

syncViewportVariables();
window.addEventListener('resize', syncViewportVariables, { passive: true });
window.addEventListener('orientationchange', syncViewportVariables, { passive: true });
window.visualViewport?.addEventListener('resize', syncViewportVariables, { passive: true });

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  // Ignore noise from browser extensions (Grammarly, Chrome internal, etc.)
  const filename = event.filename || '';
  const isExtensionError = 
    filename.startsWith('chrome-extension') || 
    filename.includes('background.js') || 
    filename.includes('content.js') ||
    filename.includes('extension') ||
    !event.error;

  if (isExtensionError) return;

  console.error('Global error:', event.error);
  // Prevent the default error handling
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  // Filter extension noise from promise rejections
  const reason = event.reason?.toString() || '';
  const isExtensionNoise = 
    reason.includes('FrameIsBrowserFrameError') || 
    reason.includes('extension port is moved into back/forward cache') ||
    reason.includes('message channel closed');

  if (isExtensionNoise) return;

  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default error handling
  event.preventDefault();
});

const renderStaticFallback = (message: string) => {
  const root = document.getElementById("root") ?? document.body;

  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;padding:16px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.08);padding:24px;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:24px;color:#111827;">Application Error</h1>
        <p style="margin:0 0 16px;color:#4b5563;">${message}</p>
        <button
          id="fabzclean-reload-app"
          style="padding:10px 16px;background:#059669;color:#ffffff;border:none;border-radius:8px;cursor:pointer;font-size:14px;"
        >
          Reload Application
        </button>
      </div>
    </div>
  `;

  document.getElementById("fabzclean-reload-app")?.addEventListener("click", () => {
    window.location.reload();
  });
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
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

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('Root element "#root" was not found');
  renderStaticFallback("The application shell is missing. Please reload and try again.");
} else {
  try {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Failed to initialize application:", error);
    renderStaticFallback("The application could not finish loading. Please reload and try again.");
  }
}
