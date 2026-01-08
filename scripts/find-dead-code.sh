#!/bin/bash
# scripts/find-dead-code.sh

echo "----------------------------------------"
echo "🔍 Scanning for Unused Exports (Dead Code)"
echo "----------------------------------------"

# Use ts-prune to find unused exports
# -y to auto-install if missing
# We ignore generated files or common patterns if needed
npx -y ts-prune --ignore 'public|assets|dist|node_modules|.d.ts'

echo "----------------------------------------"
echo "If valid exports are flagged, mark them with // ts-prune-ignore-next"
