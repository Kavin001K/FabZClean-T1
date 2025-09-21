const { app, BrowserWindow } = require('electron');

console.log('Electron app object:', app);
console.log('BrowserWindow object:', BrowserWindow);

app.whenReady().then(() => {
  console.log('App is ready!');
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadURL('https://www.google.com');
  console.log('Window created and loaded');
});

app.on('window-all-closed', () => {
  app.quit();
});
