#!/bin/bash

# EC2 Swap Setup Script
# This script sets up a 4GB swap file to prevent "JavaScript heap out of memory" errors during build.
# Run with sudo: sudo ./scripts/setup-swap.sh

echo "Checking for existing swap..."
if swapon --show | grep -q "swap"; then
    echo "✅ Swap is already active:"
    swapon --show
    exit 0
fi

echo "Creating 4GB swap file..."
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

echo "Persisting swap in /etc/fstab..."
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

echo "✅ Swap setup complete!"
free -h
