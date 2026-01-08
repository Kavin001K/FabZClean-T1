#!/bin/bash
# EC2 Deployment Script for FabZClean (PM2 Mode)
# Usage: ./deploy-ec2.sh [reset-db]

set -e  # Exit on error

echo "🚀 Starting FabZClean Deployment..."

# Check if we should reset the DB
RESET_DB=false
if [ "$1" == "reset-db" ]; then
    RESET_DB=true
    echo "⚠️  WARNING: Database reset requested. Existing data will be wiped."
fi

# ==========================================
# PHASE 0: CREATE SWAP (MUST BE FIRST!)
# ==========================================
echo "💾 Checking swap space..."
if [ ! -f /swapfile ]; then
    echo "💾 Creating 2GB Swap (prevents build OOM crashes)..."
    sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
    echo "✅ Swap created successfully"
else
    # Make sure swap is active
    if ! swapon --show | grep -q /swapfile; then
        sudo swapon /swapfile 2>/dev/null || true
    fi
    echo "✅ Swap is active: $(free -h | grep Swap | awk '{print $2}')"
fi

# Ensure log directory exists
mkdir -p logs

# Pull latest code
echo "📥 Pulling latest code..."
git stash 2>/dev/null || true
git pull origin main

# Install dependencies (skip postinstall to avoid OOM during npm install)
echo "📦 Installing dependencies..."
npm install --ignore-scripts

# Stop PM2 gracefully
echo "⏹️  Stopping PM2..."
pm2 stop ecosystem.config.cjs 2>/dev/null || pm2 stop all 2>/dev/null || true

# Database Management
if [ "$RESET_DB" = true ]; then
    echo "🗑️  Removing old database..."
    rm -f fabzclean.db fabzclean.db-shm fabzclean.db-wal
    rm -f /home/ubuntu/fabzclean_data/fabzclean.db 2>/dev/null || true
    
    # Run setup script to create fresh DB
    echo "🆕 Setting up fresh database..."
    npm run db:setup 2>/dev/null || true
else
    echo "💾 Preserving existing database..."
    
    # Run migrations to add missing columns (like factoryId)
    echo "🔧 Running database migrations..."
    if command -v sqlite3 &> /dev/null && [ -f fabzclean.db ]; then
        # Add factoryId column if missing
        sqlite3 fabzclean.db "ALTER TABLE employees ADD COLUMN factoryId TEXT;" 2>/dev/null || true
        sqlite3 fabzclean.db "ALTER TABLE employees ADD COLUMN factory_id TEXT;" 2>/dev/null || true
        echo "✅ Database schema checked"
    fi
fi

# Build Application with increased memory
echo "🔨 Building application (with increased memory limit)..."
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build:client

if [ $? -ne 0 ]; then
    echo "❌ Client build failed. Please check logs."
    exit 1
fi

# Generate version.json
echo "📄 Generating version info..."
echo "{\"version\":\"2.0.$(date +%s)\",\"buildTime\":\"$(date -Iseconds)\"}" > dist/version.json

# Start/Restart Application with PM2
echo "🚀 Starting application via PM2..."
pm2 start ecosystem.config.cjs --env production --update-env

# Save PM2 list so it restarts on reboot
pm2 save

echo ""
echo "✅ Deployment complete!"
pm2 status
echo ""
echo "🌐 Your app is running on port 5000"
echo "📜 View logs: pm2 logs fabzclean"
