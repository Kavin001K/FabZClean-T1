#!/bin/bash
echo "Checking for console.log..."
FOUND=$(grep -r "console.log" client/src server --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir="dist" --exclude-dir=".git")
if [ -n "$FOUND" ]; then
    echo "❌ console.log found:"
    echo "$FOUND"
    exit 1
fi
echo "✅ No console.log found."
