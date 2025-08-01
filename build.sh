#!/bin/bash

set -e

# Remove any existing build files - aab and apks
echo "🧹 Cleaning up old build files..."
rm -f build-*.aab app.apks
echo "🔧 Starting the build process..."

echo "🛠️ Building the project locally for Android..."
eas build --platform android --local

# Find the latest .aab file generated in the root directory
AAB_FILE=$(ls -t build-*.aab | head -n 1)

if [ -z "$AAB_FILE" ]; then
  echo "❌ No AAB file found. Build may have failed."
  exit 1
fi

echo "✅ Build complete: $AAB_FILE"

echo "📦 Generating APKs using bundletool..."
java -jar bundletool.jar build-apks \
  --bundle="$AAB_FILE" \
  --output=app.apks \
  --connected-device

echo "📲 Installing APKs on connected device..."
java -jar bundletool.jar install-apks \
  --apks=app.apks

echo "🎉 Done! App installed on connected device."