#!/bin/bash
  set -e

  echo "=== Post-merge setup ==="

  echo "Installing npm dependencies..."
  npm install --ignore-scripts --prefer-offline 2>&1 || npm install --ignore-scripts 2>&1

  echo "=== Post-merge setup complete ==="
  