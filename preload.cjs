/**
 * ============================================================================
 * FABZCLEAN ELECTRON PRELOAD SCRIPT
 * ============================================================================
 * 
 * This script runs in a sandboxed context and provides a bridge between
 * the renderer process (web app) and the main process (Node.js).
 * 
 * It exposes safe APIs for:
 * - Printing documents
 * - Getting app information
 * - Database backup/restore
 * - Opening native dialogs
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // =====================
    // Printing
    // =====================

    /**
     * Print the current page or a specific document
     * @param {Object} options - Print options (silent, copies, etc.)
     */
    print: (options = {}) => {
        ipcRenderer.send('print-document', options);
    },

    // =====================
    // App Information
    // =====================

    /**
     * Get application information
     * @returns {Promise<Object>} App info including version, paths, etc.
     */
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),

    /**
     * Check if running in Electron
     * @returns {boolean}
     */
    isElectron: true,

    // =====================
    // Database Operations
    // =====================

    /**
     * Open the data folder in file explorer
     */
    openDataFolder: () => ipcRenderer.invoke('open-data-folder'),

    /**
     * Export database backup to a file
     * @returns {Promise<{success: boolean, path?: string, error?: string}>}
     */
    exportDatabase: () => ipcRenderer.invoke('export-database'),

    /**
     * Import database from a file
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    importDatabase: () => ipcRenderer.invoke('import-database'),

    // =====================
    // Platform Detection
    // =====================

    /**
     * Get the current platform
     * @returns {string} 'win32', 'darwin', or 'linux'
     */
    platform: process.platform,

    // =====================
    // Event Listeners
    // =====================

    /**
     * Listen for events from main process
     * @param {string} channel - Event channel name
     * @param {Function} callback - Event handler
     */
    on: (channel, callback) => {
        const validChannels = ['database-synced', 'server-status', 'update-available'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },

    /**
     * Remove event listener
     * @param {string} channel - Event channel name
     * @param {Function} callback - Event handler to remove
     */
    removeListener: (channel, callback) => {
        ipcRenderer.removeListener(channel, callback);
    }
});

// Expose a minimal Node.js version info for debugging
contextBridge.exposeInMainWorld('nodeVersion', {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    v8: process.versions.v8
});

console.log('✅ FabZClean Electron Preload loaded');
