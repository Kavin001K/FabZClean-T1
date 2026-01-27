
import { isElectron } from "./utils";

/**
 * Determines the base URL for API requests.
 * 
 * Logic:
 * 1. If VITE_API_URL is defined, use that.
 * 2. If it is an Electron app, default to http://localhost:3000 (since it serves files from file:// protocol).
 * 3. Otherwise (web mode), use relative paths (proxy handles it), so return empty string.
 */
export const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // In Electron production build, we are on file:// protocol, so we MUST specify the server URL.
    // Assumption: The server is running locally on port 3000.
    if (isElectron()) {
        return "http://localhost:5001";
    }

    // In normal web development (vite) or production web serving, we use relative paths.
    return "";
};
