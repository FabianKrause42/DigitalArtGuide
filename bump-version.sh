#!/bin/bash
# Automatisches Versions-Bump Script
# Rufe dieses Script vor jedem git commit auf

VERSION_FILE="version.js"
NEW_VERSION=$(date +"%Y%m%d.%H%M")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Updating version to: $NEW_VERSION"

# Update version.js
cat > "$VERSION_FILE" << EOF
// Version der App - Bei jeder Änderung erhöhen!
export const APP_VERSION = '$NEW_VERSION';
export const BUILD_DATE = '$BUILD_DATE';
EOF

# Update index.html
sed -i "s/?v=[0-9.]*/?v=$NEW_VERSION/g" index.html

# Update manifest.json
sed -i "s/\"version\": \"[0-9.]*\"/\"version\": \"$NEW_VERSION\"/g" manifest.json

# Update sw.js
sed -i "s/const CACHE_VERSION = '[0-9.]*'/const CACHE_VERSION = '$NEW_VERSION'/g" sw.js

echo "✓ Version updated to $NEW_VERSION"
echo "✓ Ready for commit"
