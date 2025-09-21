#!/bin/bash

echo "🚀 Launching FabZClean Desktop Application..."
echo "📱 Starting development server..."

# Kill any existing processes
pkill -f "tsx server/index.ts" 2>/dev/null

# Wait a moment
sleep 2

# Start the development server in background
echo "🔄 Starting server on port 3001..."
PORT=3001 npm run dev &

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 8

# Check if server is running
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Server is running!"
    echo "🌐 Opening FabZClean in your default browser..."
    
    # Create a simple HTML file that loads the app
    cat > /tmp/fabzclean-launcher.html << 'EOF'
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
</html>
EOF
    
    # Open the launcher in the default browser
    open /tmp/fabzclean-launcher.html
    
    echo "🎉 FabZClean Desktop App is now running!"
    echo "📝 Press Ctrl+C to stop the server"
    
    # Keep the script running
    wait
else
    echo "❌ Failed to start server. Please check the logs above."
    exit 1
fi
