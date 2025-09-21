const { spawn } = require('child_process');
const http = require('http');
const { exec } = require('child_process');

let serverProcess;

function startServer() {
  console.log('🚀 Starting FabZClean server...');
  
  // Start the development server
  serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PORT: '3001' }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });

  // Wait for server to start
  setTimeout(checkServer, 5000);
}

function checkServer() {
  const req = http.get('http://localhost:3001', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Server is running!');
      console.log('🌐 Opening FabZClean in your default browser...');
      openApp();
    } else {
      console.log('⏳ Server not ready yet, retrying...');
      setTimeout(checkServer, 2000);
    }
  });

  req.on('error', (err) => {
    console.log('⏳ Server not ready yet, retrying...');
    setTimeout(checkServer, 2000);
  });
}

function openApp() {
  // Create a simple HTML launcher
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FabZClean - Desktop App</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: white;
        }
        .loading-container {
            text-align: center;
        }
        .logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .message {
            margin-top: 1rem;
            font-size: 1.1rem;
        }
        .app-frame {
            width: 100vw;
            height: 100vh;
            border: none;
            display: none;
        }
    </style>
</head>
<body>
    <div class="loading-container" id="loading">
        <div class="logo">🧺 FabZClean</div>
        <div class="spinner"></div>
        <div class="message">Starting application...</div>
    </div>
    
    <iframe id="appFrame" class="app-frame" src="http://localhost:3001"></iframe>
    
    <script>
        // Wait for the server to be ready, then show the app
        let attempts = 0;
        const maxAttempts = 30;
        
        function checkServer() {
            attempts++;
            fetch('http://localhost:3001')
                .then(response => {
                    if (response.ok) {
                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('appFrame').style.display = 'block';
                    } else {
                        throw new Error('Server not ready');
                    }
                })
                .catch(error => {
                    if (attempts < maxAttempts) {
                        setTimeout(checkServer, 1000);
                    } else {
                        document.querySelector('.message').textContent = 'Failed to connect to server. Please check if the development server is running.';
                    }
                });
        }
        
        // Start checking after a short delay
        setTimeout(checkServer, 2000);
    </script>
</body>
</html>`;

  // Write the HTML file
  require('fs').writeFileSync('/tmp/fabzclean-desktop.html', htmlContent);

  // Open in default browser
  exec('open /tmp/fabzclean-desktop.html', (error) => {
    if (error) {
      console.error('Error opening browser:', error);
    } else {
      console.log('🎉 FabZClean Desktop App is now running!');
      console.log('📝 Press Ctrl+C to stop the server');
    }
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down FabZClean...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Start the application
startServer();
