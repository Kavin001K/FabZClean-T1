#!/bin/bash

# FabZClean Deployment Script for Low-Memory Servers
# Run this on the Ubuntu server: bash deploy.sh

set -e

echo "🚀 FabZClean Deployment Starting..."

cd ~/FabZClean-T1

# Step 1: Reset any local changes
echo "📦 Resetting local changes..."
git reset --hard HEAD
git clean -fd

# Step 2: Pull latest code
echo "⬇️ Pulling latest code..."
git pull origin main

# Step 3: Install dependencies (if needed)
echo "📥 Installing dependencies..."
npm ci --prefer-offline --no-audit 2>/dev/null || npm install

# Step 4: Set Node memory limit for build
echo "🔧 Setting Node memory limit..."
export NODE_OPTIONS="--max-old-space-size=1536"

# Step 5: Build the application
echo "🏗️ Building application..."
npm run build

# Step 6: Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart fabzclean

# Step 7: Show logs
echo "📋 Showing logs..."
sleep 3
pm2 logs --lines 40 --nostream

echo "✅ Deployment complete!"
