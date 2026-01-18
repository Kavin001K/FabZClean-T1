#!/bin/bash

# ================================================
# Supabase Migration Script
# Applies RLS policies for the drivers table
# ================================================

echo "🔧 Applying Supabase migration for drivers table RLS policies..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "📦 Install it with: npm install -g supabase"
    echo ""
    echo "Or apply the migration manually:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to SQL Editor"
    echo "4. Run the SQL from: supabase/migrations/add_drivers_rls_policies.sql"
    exit 1
fi

# Apply the migration
echo "📤 Applying migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
else
    echo "❌ Migration failed. Please apply manually via Supabase Dashboard."
    echo "SQL file location: supabase/migrations/add_drivers_rls_policies.sql"
fi
