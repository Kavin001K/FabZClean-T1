#!/bin/bash

# ==========================================
# TYPESCRIPT ERROR FIXER
# Categorizes and helps fix TS errors
# ==========================================

echo "🔍 Analyzing TypeScript Errors..."
echo ""

# Get error count by type
echo "📊 Error Summary by Type:"
npm run check 2>&1 | grep "error TS" | sed 's/.*error TS\([0-9]*\).*/TS\1/' | sort | uniq -c | sort -rn | head -20

echo ""
echo "📁 Files with Most Errors:"
npm run check 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq -c | sort -rn | head -10

echo ""
echo "💡 Quick Fixes:"
echo "   - TS7006 (implicit any): Add types to function parameters"
echo "   - TS2339 (property missing): Check type definitions"
echo "   - TS2322 (type mismatch): Fix type assignments"
echo "   - TS2345 (argument type): Fix function call arguments"
echo ""
echo "🚀 To bypass checks for urgent commit:"
echo "   git commit --no-verify -m 'your message'"
