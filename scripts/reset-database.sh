#!/bin/bash

# ============================================
# FabZClean Database Reset Script
# Creates a fresh database with only admin user
# ============================================

set -e

echo "🗄️  FabZClean Database Reset"
echo "============================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get database path
DB_PATH="${DATABASE_PATH:-./fabzclean.db}"
BACKUP_PATH="${DB_PATH}.backup.$(date +%Y%m%d-%H%M%S)"

echo -e "${YELLOW}⚠️  WARNING: This will DELETE all data and create a fresh database!${NC}"
echo "Database: $DB_PATH"
echo ""
read -p "Are you sure? Type 'YES' to confirm: " confirm

if [ "$confirm" != "YES" ]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi

# Backup existing database
if [ -f "$DB_PATH" ]; then
    echo -e "${YELLOW}📦 Backing up existing database to: $BACKUP_PATH${NC}"
    cp "$DB_PATH" "$BACKUP_PATH"
    
    echo -e "${RED}🗑️  Removing existing database...${NC}"
    rm -f "$DB_PATH"
    rm -f "${DB_PATH}-shm"
    rm -f "${DB_PATH}-wal"
fi

# Also check for /home/ubuntu/fabzclean_data/fabzclean.db (production location)
PROD_DB_PATH="/home/ubuntu/fabzclean_data/fabzclean.db"
if [ -f "$PROD_DB_PATH" ]; then
    PROD_BACKUP="${PROD_DB_PATH}.backup.$(date +%Y%m%d-%H%M%S)"
    echo -e "${YELLOW}📦 Also backing up production database to: $PROD_BACKUP${NC}"
    cp "$PROD_DB_PATH" "$PROD_BACKUP"
    
    echo -e "${RED}🗑️  Removing production database...${NC}"
    rm -f "$PROD_DB_PATH"
    rm -f "${PROD_DB_PATH}-shm"
    rm -f "${PROD_DB_PATH}-wal"
fi

echo ""
echo -e "${GREEN}✅ Database files removed!${NC}"
echo ""
echo "============================================"
echo "Next Steps:"
echo "============================================"
echo ""
echo "1. Add this to your .env file:"
echo -e "   ${YELLOW}SKIP_SAMPLE_DATA=true${NC}"
echo ""
echo "2. Restart the server:"
echo "   pm2 restart fabzclean"
echo ""
echo "The server will create a fresh database with only:"
echo ""
echo "   📧 Email:    admin@myfabclean.com"
echo "   🔑 Password: Durai@2025"
echo ""
echo -e "${GREEN}Done!${NC}"
