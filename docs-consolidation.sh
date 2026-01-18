#!/bin/bash

echo "📚 Consolidating documentation..."

# Create docs directory
mkdir -p docs/archive

# Keep only essential docs in root
KEEP_DOCS="README.md"

# Move all other .md files to docs/archive
for file in *.md; do
    if [[ "$file" != "README.md" ]]; then
        mv "$file" docs/archive/ 2>/dev/null
    fi
done

echo "✅ Documentation consolidated to docs/archive/"
echo "📄 Main README.md kept in root"
