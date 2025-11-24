#!/bin/bash

# Script to find all files with DialogContent missing DialogDescription
# This will help us fix the accessibility warnings

echo "🔍 Finding all DialogContent usages without DialogDescription..."

# Search for files containing DialogContent
files_with_dialog=$(grep -r "DialogContent" /Users/kavin/Documents/GitHub/FabZClean-T1/client/src --include="*.tsx" --include="*.jsx" -l)

echo "Found the following files with DialogContent:"
echo "$files_with_dialog"

echo ""
echo "Checking which files are missing DialogDescription imports..."

for file in $files_with_dialog; do
  if ! grep -q "DialogDescription" "$file"; then
    echo "❌ Missing DialogDescription: $file"
  else
    echo "✅ Has DialogDescription: $file"
  fi
done
