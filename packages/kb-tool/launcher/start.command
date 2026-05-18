#!/bin/bash

# MAX KB Tool launcher for macOS
# Double-click to start the app in your default browser.

set -e

# Find the directory this script lives in (works even with symlinks)
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

PORT=5173
DIST_DIR="$SCRIPT_DIR/dist"

# Sanity check
if [ ! -d "$DIST_DIR" ]; then
  echo "Error: dist/ folder not found next to this launcher."
  echo "Make sure you unzipped the full archive."
  echo "Press any key to close..."
  read -n 1
  exit 1
fi

# Find an available port if 5173 is busy (try 5174, 5175, etc., up to 5180)
while lsof -i :$PORT > /dev/null 2>&1; do
  PORT=$((PORT + 1))
  if [ $PORT -gt 5180 ]; then
    echo "Could not find an available port between 5173-5180."
    echo "Close other apps using these ports and try again."
    echo "Press any key to close..."
    read -n 1
    exit 1
  fi
done

echo ""
echo "  MAX KB Tool"
echo "  ──────────────────────────────────────"
echo "  Starting on http://localhost:$PORT"
echo "  Opening browser..."
echo ""
echo "  When you're done, close this Terminal window"
echo "  (Cmd+Q or click the red dot)"
echo "  ──────────────────────────────────────"
echo ""

# Open browser after a short delay
(sleep 1 && open "http://localhost:$PORT") &

# Start Python's built-in HTTP server in the dist folder
# python3 is pre-installed on macOS 10.15+
cd "$DIST_DIR"
python3 -m http.server $PORT
