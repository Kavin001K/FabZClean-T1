import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force refresh to clear browser cache - Updated at 5:44 PM
console.log("Loading full application - v2.0");

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Prevent the default error handling
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default error handling
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
