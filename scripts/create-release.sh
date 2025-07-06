#!/bin/bash

# Script to create a new release
# Usage: ./scripts/create-release.sh v1.0.0

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 v1.0.0"
    exit 1
fi

VERSION=$1

# Validate version format
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in format vX.Y.Z (e.g., v1.0.0)"
    exit 1
fi

echo "Creating release $VERSION..."

# Update package.json version (remove 'v' prefix)
PACKAGE_VERSION=${VERSION#v}
npm version $PACKAGE_VERSION --no-git-tag-version

echo "Updated package.json to version $PACKAGE_VERSION"

# Commit the version change
git add package.json package-lock.json
git commit -m "Bump version to $VERSION"

# Create and push tag
git tag $VERSION
git push origin main
git push origin $VERSION

echo "✅ Release $VERSION created successfully!"
echo "🚀 GitHub Actions will now build and create the release automatically."
echo "📱 Check the Actions tab in your GitHub repository to monitor the build progress."
echo "📦 The APK will be available in the Releases section once the build completes." 