#!/usr/bin/env bash
set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/fabzclean}"
MYSQL_USER="${MYSQL_USER:-fabz}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-fabzpass}"
MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_DB="${MYSQL_DB:-fabzclean}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
NOW=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/fabzclean-$NOW.sql"

echo "📦 Creating database backup: $BACKUP_FILE"

# Create MySQL dump
mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -h "$MYSQL_HOST" "$MYSQL_DB" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "✅ Backup created: $BACKUP_FILE"

# Delete backups older than 14 days
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -type f -name "fabzclean-*.sql.gz" -mtime +14 -delete

echo "✅ Backup complete!"

