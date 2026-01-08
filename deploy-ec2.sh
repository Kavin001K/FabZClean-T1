#!/bin/bash
# EC2 Deployment Script for FabZClean (PM2 Mode)
# Usage: ./deploy-ec2.sh [reset-db]

echo "🚀 Starting FabZClean Deployment..."

# Check if we should reset the DB
RESET_DB=false
if [ "$1" == "reset-db" ]; then
    RESET_DB=true
    echo "⚠️  WARNING: Database reset requested. Existing data will be wiped."
fi

# ==========================================
# PHASE 0: CREATE SWAP (Prevents OOM on small instances)
# ==========================================
if [ ! -f /swapfile ]; then
    echo "💾 Creating 2GB Swap (prevents build OOM crashes)..."
    sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
    echo "✅ Swap created successfully"
else
    echo "✅ Swap already exists"
fi

# Ensure log directory exists
mkdir -p logs

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
# Using npm install to ensure we have ecosystem updates handled correctly
# In CI/CD we might use npm ci --production, but here we want to ensure tsx works
echo "📦 Installing dependencies..."
npm install

# Stop PM2
echo "⏹️  Stopping PM2..."
pm2 stop ecosystem.config.js 2>/dev/null

# Database Management
if [ "$RESET_DB" = true ]; then
    echo "🗑️  Removing old database (both locations)..."
    rm -f fabzclean.db fabzclean.db-shm fabzclean.db-wal
    rm -f /home/ubuntu/fabzclean_data/fabzclean.db /home/ubuntu/fabzclean_data/fabzclean.db-shm /home/ubuntu/fabzclean_data/fabzclean.db-wal
    
    # Run setup script to create fresh DB
    echo "🆕 Setting up fresh database..."
    npm run db:setup
else
    echo "💾 Preserving existing database..."
    
    # Run migrations to add any missing columns
    echo "🔧 Checking database schema..."
    if [ -f "scripts/run-migrations.sh" ]; then
        chmod +x scripts/run-migrations.sh
        ./scripts/run-migrations.sh
    fi
fi

# Build Application
# Increase memory limit for build process on small EC2 instances
echo "🔨 Building application..."
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check logs."
    exit 1
fi

# Prune dev dependencies to save space and improve security
echo "🧹 Pruning dev dependencies..."
npm prune --production

# Start/Restart Application with PM2
echo "🚀 Starting application via PM2..."
# Using --update-env to ensure new env vars from ecosystem.config.js are applied
pm2 start ecosystem.config.js --env production --update-env

# Save PM2 list so it restarts on reboot
pm2 save

echo ""
echo "✅ Deployment complete!"
pm2 status
echo ""
echo "🌐 Your app is running on port 5000"
echo "📜 Logs available in ./logs/out.log and ./logs/err.log"
