/**
 * ============================================================================
 * FABZCLEAN - UNIFIED DATABASE PATH CONFIGURATION
 * ============================================================================
 * 
 * This module ensures a SINGLE SOURCE OF TRUTH for the database path.
 * All modules must import from here to avoid database path inconsistencies.
 * 
 * Priority order:
 * 1. FABZCLEAN_DB_PATH environment variable (for Docker/production override)
 * 2. Electron app data directory (when running as desktop app)
 * 3. server/secure_data/fabzclean.db (default development location)
 */

import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';

// Determine if we're running in Electron
const isElectron = (): boolean => {
    // Check for Electron-specific environment
    return !!(
        process.env.ELECTRON_RUN_AS_NODE ||
        process.versions['electron'] ||
        process.env.IS_ELECTRON === 'true'
    );
};

// Get the app data directory for Electron
const getElectronAppDataPath = (): string => {
    const platform = process.platform;

    if (platform === 'win32') {
        return join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'FabZClean');
    } else if (platform === 'darwin') {
        return join(homedir(), 'Library', 'Application Support', 'FabZClean');
    } else {
        // Linux and others
        return join(homedir(), '.fabzclean');
    }
};

// Calculate the secure database directory
const getSecureDataPath = (): string => {
    // Priority 1: Explicit environment variable
    if (process.env.FABZCLEAN_DB_PATH) {
        return dirname(process.env.FABZCLEAN_DB_PATH);
    }

    // Priority 2: Electron app data directory
    if (isElectron()) {
        return join(getElectronAppDataPath(), 'data');
    }

    // Priority 3: Default server location
    const defaultPath = process.env.DATA_STORAGE_PATH || join(process.cwd(), 'server', 'secure_data');
    return defaultPath;
};

// The canonical database path
const SECURE_DATA_DIR = getSecureDataPath();
export const DATABASE_PATH = process.env.FABZCLEAN_DB_PATH || join(SECURE_DATA_DIR, 'fabzclean.db');

// Ensure the directory exists and return the path
export const ensureDatabaseDirectory = (): string => {
    const dir = dirname(DATABASE_PATH);

    if (!existsSync(dir)) {
mkdirSync(dir, { recursive: true, mode: 0o700 }); // Secure permissions
    }

    return dir;
};

// Get additional paths for backups, files, logs
export const getSecurePaths = () => {
    const baseDir = dirname(DATABASE_PATH);

    return {
        database: DATABASE_PATH,
        backups: join(baseDir, 'backups'),
        files: join(baseDir, 'files'),
        logs: join(baseDir, 'logs'),
        temp: join(baseDir, 'temp')
    };
};

// Initialize all secure directories
export const initializeSecureDirectories = (): void => {
    const paths = getSecurePaths();

    Object.values(paths).forEach(path => {
        if (path !== DATABASE_PATH && !existsSync(path)) {
            mkdirSync(path, { recursive: true, mode: 0o700 });
}
    });
};

// Export for logging
export const getDatabaseInfo = () => ({
    path: DATABASE_PATH,
    directory: dirname(DATABASE_PATH),
    isElectron: isElectron(),
    platform: process.platform,
    exists: existsSync(DATABASE_PATH)
});

// Initialize on import
ensureDatabaseDirectory();
