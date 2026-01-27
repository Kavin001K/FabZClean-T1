#!/bin/bash

# ====================================================
# FabZClean - Linux/Ubuntu Optimization & Setup Script
# ====================================================

echo "🚀 Starting Linux Optimization for FabZClean Backend..."

# 1. Update system limits (Optimization)
echo "⚙️  Optimizing system limits..."
# Increase max open files (important for SQLite + many requests)
if [ -w /etc/security/limits.conf ]; then
    echo "* soft nofile 65535" >> /etc/security/limits.conf
    echo "* hard nofile 65535" >> /etc/security/limits.conf
    echo "✅ System limits updated"
else
    echo "⚠️  Run as root to update system limits (skipping)"
fi

# 2. Ensure directories exist with correct permissions
echo "📂 Setting up secure directories..."
mkdir -p logs
mkdir -p server/secure_data
mkdir -p server/uploads

# 3. Install Production Dependencies
echo "📦 Installing dependencies..."
if [ -f package-lock.json ]; then
    npm ci --omit=dev
else
    npm install --omit=dev
fi

# 4. Rebuild Native Modules (Critical for SQLite on Linux)
echo "🛠️  Rebuilding native modules (better-sqlite3)..."
npm rebuild better-sqlite3

# 5. Build Backend
echo "🏗️  Building backend optimized..."
# Use max memory for build just in case
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build:server

# 6. PM2 Setup
echo "🚀 Configuring PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Reload or Start
if pm2 list | grep -q "fabzclean"; then
    pm2 reload fabzclean
    echo "✅ PM2 process reloaded"
else
    pm2 start ecosystem.config.cjs
    echo "✅ PM2 process started"
fi

# 7. Save PM2 list
pm2 save

echo "===================================================="
echo "✅ Backend Optimization Complete!"
echo "📡 Server running on port 5000"
echo "📝 Logs: pm2 logs fabzclean"
echo "===================================================="
