const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "FabzClean Manager",
        icon: path.join(__dirname, '../client/public/assets/Logoz.ico'), // Uses your existing icon
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Allows simple printing communication
            webSecurity: false // Helps with loading content across domains if needed
        }
    });

    // 🚀 CRITICAL: Connects to your live server
    const storeUrl = 'https://fabz.acedigital.space';

    mainWindow.loadURL(storeUrl);

    // Handle external links (open in default browser instead of the app)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // 🖨️ Silent Printing Handler
    // This receives the print command from your website and prints without a popup
    ipcMain.on('do-print', (event, options) => {
        const printWindow = new BrowserWindow({ show: false, width: 800, height: 600 });
        printWindow.loadURL(options.url);

        printWindow.webContents.on('did-finish-load', () => {
            printWindow.webContents.print({
                silent: true,
                deviceName: options.printerName || '' // Uses default printer if specific name not found
            }, (success, errorType) => {
                if (!success) console.log("Print failed:", errorType);
                printWindow.close();
            });
        });
    });

    mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});
