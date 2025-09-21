console.log('Starting Electron test...');

try {
  const { app, BrowserWindow } = require('electron');
  console.log('Electron modules loaded successfully');
  console.log('app:', typeof app);
  console.log('BrowserWindow:', typeof BrowserWindow);
  
  if (app && app.whenReady) {
    console.log('app.whenReady is available');
  } else {
    console.log('app.whenReady is NOT available');
  }
} catch (error) {
  console.error('Error loading Electron modules:', error);
}
