/**
 * ============================================================================
 * FABZCLEAN ELECTRON MAIN PROCESS
 * ============================================================================
 * 
 * This is the main entry point for the Electron desktop application.
 * Key features:
 * - Spawns the server process with proper database configuration
 * - Handles offline mode gracefully
 * - Manages app lifecycle and window state
 * - Provides IPC for printing and native features
 * 
 * @version 2.0.0
 */

const { app, BrowserWindow, ipcMain, shell, dialog, Menu, Tray } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');
const os = require('os');
const fs = require('fs');

// ============================================================================
// PATHS CONFIGURATION
// ============================================================================

// Determine app data path based on platform
const getAppDataPath = () => {
    const platform = process.platform;
    if (platform === 'win32') {
        return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'FabZClean');
    } else if (platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', 'FabZClean');
    } else {
        return path.join(os.homedir(), '.fabzclean');
    }
};

const APP_DATA_PATH = getAppDataPath();
const SECURE_DATA_PATH = path.join(APP_DATA_PATH, 'data');
const DATABASE_PATH = path.join(SECURE_DATA_PATH, 'fabzclean.db');
const LOGS_PATH = path.join(APP_DATA_PATH, 'logs');

// Ensure all directories exist
const ensureDirectories = () => {
    [APP_DATA_PATH, SECURE_DATA_PATH, LOGS_PATH].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created: ${dir}`);
        }
    });
};

// ============================================================================
// SERVER PROCESS MANAGEMENT
// ============================================================================

let serverProcess = null;
let mainWindow = null;
let tray = null;
let isQuitting = false;

const SERVER_PORT = 5001;
const SERVER_HOST = '127.0.0.1';
const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

/**
 * Start the embedded server
 */
const startServer = () => {
    return new Promise((resolve, reject) => {
        console.log('🚀 Starting FabZClean embedded server...');

        // Set environment variables for the server
        const serverEnv = {
            ...process.env,
            NODE_ENV: 'production',
            IS_ELECTRON: 'true',
            PORT: SERVER_PORT.toString(),
            HOST: SERVER_HOST,
            FABZCLEAN_DB_PATH: DATABASE_PATH,
            DATA_STORAGE_PATH: SECURE_DATA_PATH,
            SKIP_SAMPLE_DATA: 'false', // Create sample data on first run
        };

        // Determine server path
        let serverPath;
        if (app.isPackaged) {
            // In packaged app, use bundled server
            serverPath = path.join(process.resourcesPath, 'dist-server', 'server.js');
        } else {
            // In development, use tsx to run TypeScript directly
            serverPath = path.join(__dirname, 'server', 'minimal-server.ts');
        }

        console.log(`📂 Server path: ${serverPath}`);
        console.log(`🗃️  Database path: ${DATABASE_PATH}`);

        if (app.isPackaged) {
            // Production: run bundled JS using Electron's internal Node
            // Set NODE_PATH to find native modules in the packaged app
            const nodeModulesPath = path.join(path.dirname(process.resourcesPath), 'node_modules');
            const resourcesNodeModules = path.join(process.resourcesPath, '..', 'node_modules');
            serverProcess = spawn(process.execPath, [serverPath], {
                cwd: path.dirname(serverPath),
                env: {
                    ...serverEnv,
                    ELECTRON_RUN_AS_NODE: '1',
                    NODE_PATH: resourcesNodeModules
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });
        } else {
            // Development: use tsx
            serverProcess = spawn('npx', ['tsx', serverPath], {
                cwd: __dirname,
                env: serverEnv,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });
        }

        // Log server output
        serverProcess.stdout.on('data', (data) => {
            const msg = data.toString().trim();
            console.log(`[Server] ${msg}`);

            // Detect server ready
            if (msg.includes('running on') || msg.includes('listening')) {
                console.log('✅ Server is ready!');
                resolve();
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`[Server Error] ${data.toString().trim()}`);
        });

        serverProcess.on('error', (err) => {
            console.error('❌ Failed to start server:', err);
            reject(err);
        });

        serverProcess.on('exit', (code) => {
            console.log(`Server exited with code ${code}`);
            serverProcess = null;
            if (!isQuitting) {
                // Restart server if it crashes
                setTimeout(() => startServer(), 2000);
            }
        });

        // Timeout for server startup
        setTimeout(() => {
            resolve(); // Resolve anyway after timeout
        }, 10000);
    });
};

/**
 * Stop the embedded server
 */
const stopServer = () => {
    if (serverProcess) {
        console.log('🛑 Stopping embedded server...');
        serverProcess.kill('SIGTERM');
        serverProcess = null;
    }
};

// ============================================================================
// WINDOW MANAGEMENT
// ============================================================================

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
            webSecurity: app.isPackaged, // Enable in production
        },
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        backgroundColor: '#1a1a2e',
        show: false, // Don't show until ready
        icon: path.join(__dirname, 'client', 'public', 'assets', 'fabclean-logo-512.png')
    });

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // Load the app
    if (app.isPackaged) {
        // Production: load built files
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        // Development: load from dev server
        mainWindow.loadURL(SERVER_URL);
        // Open DevTools in development
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    // Handle downloads
    mainWindow.webContents.session.on('will-download', (event, item) => {
        const fileName = item.getFilename();
        const savePath = path.join(app.getPath('downloads'), fileName);
        item.setSavePath(savePath);

        item.once('done', (event, state) => {
            if (state === 'completed') {
                shell.showItemInFolder(savePath);
            }
        });
    });

    // Handle window close
    mainWindow.on('close', (event) => {
        if (!isQuitting && process.platform === 'darwin') {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// ============================================================================
// IPC HANDLERS
// ============================================================================

// Print document
ipcMain.on('print-document', (event, options) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.webContents.print({
            silent: false,
            printBackground: true,
            deviceName: '',
            ...options
        });
    }
});

// Get app info
ipcMain.handle('get-app-info', () => {
    return {
        version: app.getVersion(),
        platform: process.platform,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        databasePath: DATABASE_PATH,
        appDataPath: APP_DATA_PATH,
        isPackaged: app.isPackaged
    };
});

// Open database folder
ipcMain.handle('open-data-folder', async () => {
    shell.openPath(SECURE_DATA_PATH);
    return true;
});

// Export database backup
ipcMain.handle('export-database', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Database Backup',
        defaultPath: `fabzclean-backup-${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    });

    if (!result.canceled && result.filePath) {
        try {
            fs.copyFileSync(DATABASE_PATH, result.filePath);
            return { success: true, path: result.filePath };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
    return { success: false, error: 'Cancelled' };
});

// Import database
ipcMain.handle('import-database', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Database',
        filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        try {
            // Backup current database
            const backupPath = DATABASE_PATH + '.backup';
            if (fs.existsSync(DATABASE_PATH)) {
                fs.copyFileSync(DATABASE_PATH, backupPath);
            }

            // Import new database
            fs.copyFileSync(result.filePaths[0], DATABASE_PATH);

            // Restart server to use new database
            stopServer();
            await startServer();

            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
    return { success: false, error: 'Cancelled' };
});

// ============================================================================
// APP LIFECYCLE
// ============================================================================

app.whenReady().then(async () => {
    console.log('🚀 FabZClean Desktop App Starting...');
    console.log(`📂 App Data Path: ${APP_DATA_PATH}`);
    console.log(`🗃️  Database Path: ${DATABASE_PATH}`);

    // Ensure directories exist
    ensureDirectories();

    // Start the embedded server
    try {
        await startServer();
    } catch (err) {
        console.error('Failed to start server:', err);
        dialog.showErrorBox('Server Error', 'Failed to start the embedded server. The application may not function correctly.');
    }

    // Create the main window
    createWindow();

    // macOS: Re-create window when dock icon is clicked
    app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        isQuitting = true;
        stopServer();
        app.quit();
    }
});

app.on('before-quit', () => {
    isQuitting = true;
    stopServer();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    dialog.showErrorBox('Application Error', `An unexpected error occurred:\n${error.message}`);
});
