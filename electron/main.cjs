const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "FabzClean Manager",
        // This points to your existing icon
        icon: path.join(__dirname, '../client/public/assets/Logoz.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false // Required for cross-domain loading
        }
    });

    // 🚀 CONNECT TO YOUR NEW LIVE SERVER
    mainWindow.loadURL('https://fab.acedigital.space');

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Silent Printing Handler (No popup)
    ipcMain.on('do-print', (event, options) => {
        const printWindow = new BrowserWindow({ show: false });
        printWindow.loadURL(options.url);

        printWindow.webContents.on('did-finish-load', () => {
            printWindow.webContents.print({
                silent: true,
                deviceName: options.printerName || ''
            }, (success, errorType) => {
                if (!success) console.log("Print failed:", errorType);
                printWindow.close();
            });
        });
    });

    mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
