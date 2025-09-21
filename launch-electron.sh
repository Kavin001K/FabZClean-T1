#!/bin/bash

echo "🚀 Launching FabZClean Electron App..."
echo "📱 Starting development server and Electron window..."

# Kill any existing processes
pkill -f "tsx server/index.ts" 2>/dev/null
pkill -f "electron" 2>/dev/null

# Wait a moment
sleep 2

# Start the Electron app
npm run electron:dev
