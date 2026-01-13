#!/bin/bash

# ==========================================
# FABZCLEAN ANTIGRAVITY DEPLOYMENT SCRIPT
# Target: AWS EC2 (Ubuntu 22.04 / Amazon Linux 2)
# Hybrid Architecture: PostgreSQL + MongoDB + Node.js
# ==========================================

set -e  # Exit on error

echo "=========================================="
echo "🚀 ANTIGRAVITY DEPLOYMENT PROTOCOL"
echo "   FabZClean Hybrid Architecture"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "📦 $1"; }

# ==========================================
# PHASE 1: OS OPTIMIZATION
# ==========================================
echo ""
echo "📌 PHASE 1: System Optimization"
echo "-------------------------------------------"

# 1.1 Create Swap Space (Critical for t3.small/micro)
if [ ! -f /swapfile ]; then
    log_info "Allocating 2GB Swap Memory..."
    sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
    log_success "Swap Space Created (2GB)"
else
    log_success "Swap already exists"
fi

# 1.2 Set swappiness for production
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true
sudo sysctl vm.swappiness=10 > /dev/null 2>&1 || true

# 1.3 Increase file limits
echo "fs.file-max = 65535" | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true
sudo sysctl -p > /dev/null 2>&1 || true
log_success "System limits optimized"

# ==========================================
# PHASE 2: INSTALL DOCKER
# ==========================================
echo ""
echo "📌 PHASE 2: Docker Installation"
echo "-------------------------------------------"

if ! command -v docker &> /dev/null; then
    log_info "Installing Docker Engine..."
    
    # Update and install prerequisites
    sudo apt-get update -qq
    sudo apt-get install -y -qq ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    log_success "Docker Installed"
else
    log_success "Docker already installed"
fi

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker
log_success "Docker service running"

# ==========================================
# PHASE 3: PREPARE DIRECTORIES
# ==========================================
echo ""
echo "📌 PHASE 3: Directory Setup"
echo "-------------------------------------------"

# Create required directories
mkdir -p logs uploads nginx/ssl infrastructure
chmod 755 logs uploads

# Create placeholder SSL directory
touch nginx/ssl/.gitkeep 2>/dev/null || true

log_success "Directories prepared"

# ==========================================
# PHASE 4: ENVIRONMENT CONFIGURATION
# ==========================================
echo ""
echo "📌 PHASE 4: Environment Configuration"
echo "-------------------------------------------"

if [ ! -f .env.production ]; then
    log_warn "No .env.production found. Creating from template..."
    if [ -f .env.production.template ]; then
        cp .env.production.template .env.production
        log_success "Created .env.production from template"
    else
        cat > .env.production << 'EOF'
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# PostgreSQL (Change these in production!)
POSTGRES_PASSWORD=change_this_secure_password

# Session Secret (Generate with: openssl rand -hex 32)
SESSION_SECRET=change_this_in_production_use_openssl_rand

# MongoDB (Auto-configured in Docker)
MONGO_URI=mongodb://mongo:27017/fabzclean_analytics
EOF
        log_warn "Created default .env.production - PLEASE UPDATE SECRETS!"
    fi
else
    log_success ".env.production exists"
fi

# Source environment for Docker Compose
set -a
source .env.production 2>/dev/null || true
set +a

# ==========================================
# PHASE 5: BUILD & DEPLOY
# ==========================================
echo ""
echo "📌 PHASE 5: Build & Deploy"
echo "-------------------------------------------"

# Stop existing containers gracefully
log_info "Stopping existing containers..."
sudo docker compose -f docker-compose.ec2.yml down --remove-orphans 2>/dev/null || true

# Build with production optimizations
log_info "Building containers (this may take a few minutes)..."
sudo docker compose -f docker-compose.ec2.yml build --no-cache

# Start services
log_info "Starting Hybrid Architecture..."
sudo docker compose -f docker-compose.ec2.yml up -d

# Wait for health checks
log_info "Waiting for services to be healthy..."
sleep 10

# Check container status
echo ""
echo "📌 Container Status:"
echo "-------------------------------------------"
sudo docker compose -f docker-compose.ec2.yml ps

# ==========================================
# PHASE 6: POST-DEPLOYMENT CHECKS
# ==========================================
echo ""
echo "📌 PHASE 6: Health Checks"
echo "-------------------------------------------"

# Check if app is responding
sleep 5
if curl -s http://localhost/api/health > /dev/null 2>&1; then
    log_success "API Health Check: PASSED"
else
    log_warn "API not responding yet (may need more time to start)"
fi

# Check MongoDB connection
if sudo docker exec fabzclean-mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    log_success "MongoDB: CONNECTED"
else
    log_warn "MongoDB: Starting up..."
fi

# Check PostgreSQL connection
if sudo docker exec fabzclean-postgres pg_isready -U fabz > /dev/null 2>&1; then
    log_success "PostgreSQL: CONNECTED"
else
    log_warn "PostgreSQL: Starting up..."
fi

# ==========================================
# DEPLOYMENT COMPLETE
# ==========================================
echo ""
echo "=========================================="
echo "✨ ANTIGRAVITY DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🌐 Access Points:"
echo "   - Web App:    http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR-EC2-IP')"
echo "   - Health:     http://localhost/api/health"
echo ""
echo "📊 Database Ports (Internal Only):"
echo "   - PostgreSQL: 5432 (ACID - Users, Orders)"
echo "   - MongoDB:    27017 (Flexible - Logs, Analytics)"
echo ""
echo "📋 Useful Commands:"
echo "   - View logs:     sudo docker compose -f docker-compose.ec2.yml logs -f"
echo "   - Restart:       sudo docker compose -f docker-compose.ec2.yml restart"
echo "   - Stop:          sudo docker compose -f docker-compose.ec2.yml down"
echo "   - DB Shell:      sudo docker exec -it fabzclean-postgres psql -U fabz -d fabzclean"
echo "   - Mongo Shell:   sudo docker exec -it fabzclean-mongo mongosh"
echo ""
echo "🔒 IMPORTANT: Update passwords in .env.production before production use!"
echo "=========================================="
