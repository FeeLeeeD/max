#!/bin/bash

# Build and package MAX KB Tool for distribution

set -e

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PACKAGE_DIR="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"
OUTPUT_DIR="$PACKAGE_DIR/release"
STAGING_DIR="$OUTPUT_DIR/kb-tool"

echo "==> Cleaning previous build..."
rm -rf "$PACKAGE_DIR/dist" "$OUTPUT_DIR"

echo "==> Building production bundle..."
cd "$PACKAGE_DIR"
pnpm build

echo "==> Staging release folder..."
mkdir -p "$STAGING_DIR"
cp -R "$PACKAGE_DIR/dist" "$STAGING_DIR/dist"
cp "$PACKAGE_DIR/launcher/start.command" "$STAGING_DIR/start.command"
cp "$PACKAGE_DIR/launcher/README.md" "$STAGING_DIR/README.md"
chmod +x "$STAGING_DIR/start.command"

echo "==> Creating zip archive..."
cd "$OUTPUT_DIR"
ZIP_NAME="kb-tool-$(date +%Y%m%d).zip"
zip -r "$ZIP_NAME" kb-tool > /dev/null

echo ""
echo "  Done!"
echo "  ──────────────────────────────────────"
echo "  Folder:  $STAGING_DIR"
echo "  Archive: $OUTPUT_DIR/$ZIP_NAME"
echo "  ──────────────────────────────────────"
echo ""
echo "  Send the zip file to the marketer."
