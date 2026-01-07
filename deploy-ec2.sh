#!/bin/bash
# EC2 Deployment Script for FabZClean
# Run this on your EC2 instance

echo "🚀 Starting FabZClean Deployment..."

# Stop PM2
echo "⏹️  Stopping PM2..."
pm2 stop all 2>/dev/null

# Delete old database to recreate with new schema
# Production database is stored in /home/ubuntu/fabzclean_data/, not in project folder!
echo "🗑️  Removing old database (both locations)..."
rm -f fabzclean.db fabzclean.db-shm fabzclean.db-wal
rm -f /home/ubuntu/fabzclean_data/fabzclean.db /home/ubuntu/fabzclean_data/fabzclean.db-shm /home/ubuntu/fabzclean_data/fabzclean.db-wal

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies (skip dev dependencies for production)
echo "📦 Installing dependencies..."
npm ci --production 2>/dev/null || npm install --production

# Increase Node memory and build
echo "🔨 Building application (with increased memory)..."
export NODE_OPTIONS="--max-old-space-size=1024"
npm run build:client

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Trying with even more memory..."
    export NODE_OPTIONS="--max-old-space-size=2048"
    npm run build:client
    
    if [ $? -ne 0 ]; then
        echo "❌ Build failed again. Please build locally and copy dist folder."
        exit 1
    fi
fi

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart all

# Show status
echo ""
echo "✅ Deployment complete!"
pm2 status
echo ""
echo "🌐 Your app should be available at: http://13.201.55.242:5000"
