#!/bin/bash

# FabZClean Cleanup Script
# Removes unnecessary files to reduce project size

echo "🧹 Starting cleanup..."

# 1. Remove duplicate database
echo "📦 Removing duplicate database..."
rm -f "fabzclean 2.db"

# 2. Remove old Python FastAPI backend (unused)
echo "🐍 Removing old FastAPI backend..."
rm -rf fabzclean-fastapi
rm -rf src

# 3. Remove test files
echo "🧪 Removing test files..."
rm -rf tests
rm -f test-frontend.html
rm -f test-server.js

# 4. Remove backup files
echo "💾 Removing backup files..."
find . -type f -name "*.bak" -delete
find . -type f -name "*backup*" -delete
find . -type f -name "*old*" -not -path "./node_modules/*" -delete

# 5. Remove demo/example files
echo "🎨 Removing demo files..."
rm -f client/src/components/dashboard/date-filter-demo.tsx
rm -f client/src/lib/demo-data.ts

# 6. Remove Replit config (not needed for local dev)
echo "⚙️  Removing Replit config..."
rm -rf .local
rm -f .replit
rm -f replit.nix

# 7. Remove Supabase temp files
echo "🗄️  Cleaning Supabase temp files..."
rm -rf supabase/.temp

# 8. Remove large documentation PDFs/images if any
echo "📄 Cleaning large assets..."
find . -type f -name "*.pdf" -size +1M -not -path "./node_modules/*" -delete
find . -type f -name "*.zip" -not -path "./node_modules/*" -delete
find . -type f -name "*.tar.gz" -not -path "./node_modules/*" -delete

# 9. Remove log files
echo "📝 Removing log files..."
find . -type f -name "*.log" -not -path "./node_modules/*" -delete

# 10. Remove unnecessary API collection files
echo "📮 Removing Postman collections..."
rm -f FabZClean_API.postman_collection.json
rm -f openapi.yaml

# 11. Clean npm cache
echo "🗑️  Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Current directory size:"
du -sh .
echo ""
echo "💡 To further reduce size, run:"
echo "   rm -rf node_modules && npm install --production"
