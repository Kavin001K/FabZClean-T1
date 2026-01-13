#!/bin/bash
# scripts/dev-mac.sh

echo "Starting FabZClean Dev Environment on Mac..."

# Function to verify server is up (Port 5001 for Dev)
wait_for_server() {
  echo "Waiting for server to be ready on port 5001..."
  local retries=60
  local wait=1
  local url="http://localhost:5001/api/health"
  
  for ((i=0; i<retries; i++)); do
    # Try to connect to localhost 5001
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
      echo "Server is UP!"
      # Send Notification (Mac only)
      if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e 'display notification "Server is running at http://localhost:5001" with title "FabZClean Dev" sound name "Glass"'
      fi
      # Open Browser
      open "http://localhost:5001"
      return 0
    fi
    sleep $wait
  done
  echo "Server failed to start within $((retries*wait)) seconds."
  return 1
}

# Run the wait function in background
wait_for_server &

# Start the actual dev server
npm run dev
