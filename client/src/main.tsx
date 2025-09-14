import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force refresh to clear browser cache - Updated at 5:44 PM
console.log("Loading full application - v2.0");

createRoot(document.getElementById("root")!).render(<App />);
