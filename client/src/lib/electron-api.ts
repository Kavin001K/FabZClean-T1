/**
 * ============================================================================
 * ELECTRON API TYPE DECLARATIONS
 * ============================================================================
 * 
 * Type declarations for the Electron API exposed via the preload script.
 * These APIs are only available when running in the Electron desktop app.
 */

export interface ElectronAppInfo {
    version: string;
    platform: 'win32' | 'darwin' | 'linux';
    electronVersion: string;
    nodeVersion: string;
    databasePath: string;
    appDataPath: string;
    isPackaged: boolean;
}

export interface DatabaseExportResult {
    success: boolean;
    path?: string;
    error?: string;
}

export interface DatabaseImportResult {
    success: boolean;
    error?: string;
}

export interface ElectronAPI {
    // Printing
    print: (options?: {
        silent?: boolean;
        printBackground?: boolean;
        deviceName?: string;
        copies?: number;
    }) => void;

    // App Information
    getAppInfo: () => Promise<ElectronAppInfo>;
    isElectron: boolean;

    // Database Operations
    openDataFolder: () => Promise<boolean>;
    exportDatabase: () => Promise<DatabaseExportResult>;
    importDatabase: () => Promise<DatabaseImportResult>;

    // Platform Detection
    platform: 'win32' | 'darwin' | 'linux';

    // Event Listeners
    on: (channel: string, callback: (...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

export interface NodeVersionInfo {
    node: string;
    electron: string;
    chrome: string;
    v8: string;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
        nodeVersion?: NodeVersionInfo;
    }
}

/**
 * Check if running in Electron environment
 */
export const isElectron = (): boolean => {
    return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
};

/**
 * Get the Electron API if available
 */
export const getElectronAPI = (): ElectronAPI | null => {
    if (isElectron()) {
        return window.electronAPI!;
    }
    return null;
};

/**
 * Print the current page (works in both Electron and browser)
 */
export const printDocument = (options?: { silent?: boolean }): void => {
    const api = getElectronAPI();
    if (api) {
        api.print(options);
    } else {
        window.print();
    }
};

/**
 * Get app info (Electron only)
 */
export const getAppInfo = async (): Promise<ElectronAppInfo | null> => {
    const api = getElectronAPI();
    if (api) {
        return api.getAppInfo();
    }
    return null;
};

/**
 * Export database backup (Electron only)
 */
export const exportDatabase = async (): Promise<DatabaseExportResult> => {
    const api = getElectronAPI();
    if (api) {
        return api.exportDatabase();
    }
    return { success: false, error: 'Not running in Electron' };
};

/**
 * Import database (Electron only)
 */
export const importDatabase = async (): Promise<DatabaseImportResult> => {
    const api = getElectronAPI();
    if (api) {
        return api.importDatabase();
    }
    return { success: false, error: 'Not running in Electron' };
};
