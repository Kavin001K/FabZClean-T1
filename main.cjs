const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "FabzClean Store Manager",
        icon: path.join(__dirname, 'client/public/assets/Logoz.ico'), // Uncomment if icon exists
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false // ALLOWS LOADING EXTERNAL CONTENT
        }
    });

    // Load your Cloudflare URL
    mainWindow.loadURL('https://store.acedigital.space');

    // Handle printing
    ipcMain.on('do-print', (event, options) => {
        const printWindow = new BrowserWindow({ show: false });
        printWindow.loadURL(options.url);
        printWindow.webContents.on('did-finish-load', () => {
            printWindow.webContents.print({ silent: true });
        });
    });

    // Handle external links to open in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://')) {
            const { shell } = require('electron');
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
