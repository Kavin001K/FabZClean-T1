#!/bin/bash

# ==========================================
# FABZCLEAN DATABASE MIGRATION RUNNER
# Applies all pending migrations to SQLite
# ==========================================

DB_FILE="${DB_FILE:-fabzclean.db}"
MIGRATIONS_DIR="server/migrations"

echo "🔧 FabZClean Migration Runner"
echo "================================="

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo "⚠️  Database file not found: $DB_FILE"
    echo "   The database will be created on first server start."
    exit 0
fi

# Check if sqlite3 is available
if ! command -v sqlite3 &> /dev/null; then
    echo "⚠️  sqlite3 command not found."
    echo "   Install with: sudo apt-get install sqlite3"
    echo ""
    echo "   Alternative: Delete the database to recreate it fresh:"
    echo "   rm $DB_FILE"
    exit 1
fi

echo "📁 Database: $DB_FILE"
echo ""

# Apply migrations
apply_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")
    
    echo "📄 Applying: $migration_name"
    
    # Run migration with error handling
    if sqlite3 "$DB_FILE" < "$migration_file" 2>/dev/null; then
        echo "   ✅ Success"
    else
        # Check if error is "column already exists" (which is OK)
        local result=$(sqlite3 "$DB_FILE" < "$migration_file" 2>&1)
        if echo "$result" | grep -q "duplicate column name"; then
            echo "   ⏭️  Already applied (columns exist)"
        else
            echo "   ⚠️  Warning: $result"
        fi
    fi
}

# Run all .sql files in migrations directory
if [ -d "$MIGRATIONS_DIR" ]; then
    for migration in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$migration" ]; then
            apply_migration "$migration"
        fi
    done
else
    echo "⚠️  Migrations directory not found: $MIGRATIONS_DIR"
fi

echo ""
echo "✅ Migration check complete!"
echo ""

# Show current table structure
echo "📊 Current employees table columns:"
sqlite3 "$DB_FILE" "PRAGMA table_info(employees);" 2>/dev/null | cut -d'|' -f2 | head -20
