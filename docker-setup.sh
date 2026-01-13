#!/bin/bash

# ============================================
# FabZClean Docker Setup Script
# For Home Server Deployment
# ============================================

set -e

echo "🚀 FabZClean Docker Setup"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed.${NC}"
        echo "Please install Docker first: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker is installed${NC}"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed.${NC}"
        echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker Compose is installed${NC}"
}

# Create .env file if not exists
setup_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
        cp .env.example .env
        
        # Generate a random JWT secret
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
        sed -i.bak "s|your-super-secret-jwt-key-change-this-in-production|${JWT_SECRET}|g" .env
        rm -f .env.bak
        
        echo -e "${GREEN}✓ .env file created with secure JWT secret${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env to configure your settings${NC}"
    else
        echo -e "${GREEN}✓ .env file already exists${NC}"
    fi
}

# Create necessary directories
setup_directories() {
    echo -e "${BLUE}📁 Creating directories...${NC}"
    mkdir -p backups
    mkdir -p nginx/certs
    echo -e "${GREEN}✓ Directories created${NC}"
}

# Build Docker image
build_image() {
    echo -e "${BLUE}🔨 Building Docker image...${NC}"
    docker compose build --no-cache fabzclean
    echo -e "${GREEN}✓ Docker image built${NC}"
}

# Start containers
start_containers() {
    echo -e "${BLUE}🚀 Starting containers...${NC}"
    docker compose up -d fabzclean
    echo -e "${GREEN}✓ Containers started${NC}"
}

# Show status
show_status() {
    echo ""
    echo "============================================"
    echo -e "${GREEN}✅ FabZClean is running!${NC}"
    echo "============================================"
    echo ""
    docker compose ps
    echo ""
    echo -e "${BLUE}📊 Access your app at:${NC}"
    echo "   http://localhost:5000"
    
    # Get local IP
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || echo "your-ip")
    echo "   http://${LOCAL_IP}:5000"
    echo ""
    echo -e "${BLUE}📋 Useful commands:${NC}"
    echo "   View logs:     docker compose logs -f fabzclean"
    echo "   Stop:          docker compose down"
    echo "   Restart:       docker compose restart fabzclean"
    echo "   Backup DB:     ./scripts/backup-db.sh"
    echo ""
}

# Main script
main() {
    echo ""
    check_docker
    check_docker_compose
    setup_env
    setup_directories
    build_image
    start_containers
    show_status
}

# Handle script arguments
case "${1:-}" in
    "build")
        build_image
        ;;
    "start")
        start_containers
        show_status
        ;;
    "stop")
        docker compose down
        echo -e "${GREEN}✓ Containers stopped${NC}"
        ;;
    "restart")
        docker compose restart fabzclean
        show_status
        ;;
    "logs")
        docker compose logs -f fabzclean
        ;;
    "status")
        docker compose ps
        ;;
    "update")
        echo -e "${BLUE}🔄 Updating FabZClean...${NC}"
        git pull origin main
        build_image
        docker compose up -d fabzclean
        show_status
        ;;
    "backup")
        BACKUP_FILE="backups/fabzclean-$(date +%Y%m%d-%H%M%S).db"
        docker compose exec fabzclean cp /app/data/fabzclean.db /app/backups/
        echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (none)    Full setup and start"
        echo "  build     Build Docker image only"
        echo "  start     Start containers"
        echo "  stop      Stop containers"
        echo "  restart   Restart containers"
        echo "  logs      View live logs"
        echo "  status    Show container status"
        echo "  update    Pull latest code and rebuild"
        echo "  backup    Backup database"
        echo "  help      Show this help"
        ;;
    *)
        main
        ;;
esac
