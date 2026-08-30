#!/bin/bash
# Build script for Vercel deployment
# Replaces the API URL placeholder with environment variable

set -e

echo "🔧 Injecting environment variables..."

if [ -z "$VITE_API_URL" ]; then
  echo "⚠️  Warning: VITE_API_URL not set, using placeholder"
  VITE_API_URL="http://localhost:8000"
fi

echo "Backend API URL: $VITE_API_URL"

# Replace placeholder in env.js with actual value
sed -i.bak "s|__VITE_API_URL__|$VITE_API_URL|g" frontend/env.js

# Clean up backup file
rm -f frontend/env.js.bak

echo "✅ Build complete!"
