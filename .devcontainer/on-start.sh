#!/bin/bash

# Start a background process to monitor container lifecycle
cleanup() {
  echo "Container is stopping..."
  git add . || git commit -m "Auto-commit" || git push
}

# Trap SIGTERM (sent when the container stops)
trap cleanup SIGTERM

# Keep the script running to listen for the signal
while true; do
  sleep 1
done
