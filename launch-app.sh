#!/bin/bash

echo "🚀 Launching FabZClean Application..."
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
    open http://localhost:3001
    echo "🎉 FabZClean is now running at http://localhost:3001"
    echo "📝 Press Ctrl+C to stop the server"
    
    # Keep the script running
    wait
else
    echo "❌ Failed to start server. Please check the logs above."
    exit 1
fi
