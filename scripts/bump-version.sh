#!/bin/bash

# Version Bump Utility for Gearspire
# Usage: ./scripts/bump-version.sh [major|minor|patch]
# Default: patch

BUMP_TYPE=${1:-patch}

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo "Error: Invalid bump type. Use 'major', 'minor', or 'patch'"
    echo "Usage: $0 [major|minor|patch]"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Bumping $BUMP_TYPE version..."

# Run the Node.js version bump script
node "$SCRIPT_DIR/bump-version.js" "$BUMP_TYPE"

if [ $? -eq 0 ]; then
    echo "✅ Version bump completed successfully!"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Test your changes"
    echo "   2. Commit your changes: git add . && git commit -m 'Bump version'"
    echo "   3. Create a release tag if needed"
else
    echo "❌ Version bump failed!"
    exit 1
fi