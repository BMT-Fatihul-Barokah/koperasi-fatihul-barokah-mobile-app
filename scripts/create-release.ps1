#!/usr/bin/env pwsh

# Script to create a new release
# Usage: ./scripts/create-release.ps1 v1.0.0

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

# Validate version format
if ($Version -notmatch '^v\d+\.\d+\.\d+$') {
    Write-Error "Version must be in format vX.Y.Z (e.g., v1.0.0)"
    exit 1
}

Write-Host "Creating release $Version..." -ForegroundColor Green

# Update package.json version (remove 'v' prefix)
$PackageVersion = $Version.Substring(1)
npm version $PackageVersion --no-git-tag-version

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to update package.json version"
    exit 1
}

Write-Host "Updated package.json to version $PackageVersion" -ForegroundColor Yellow

# Commit the version change
git add package.json package-lock.json
git commit -m "Bump version to $Version"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to commit version change"
    exit 1
}

# Create and push tag
git tag $Version
git push origin main
git push origin $Version

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to push tag"
    exit 1
}

Write-Host "✅ Release $Version created successfully!" -ForegroundColor Green
Write-Host "🚀 GitHub Actions will now build and create the release automatically." -ForegroundColor Cyan
Write-Host "📱 Check the Actions tab in your GitHub repository to monitor the build progress." -ForegroundColor Cyan
Write-Host "📦 The APK will be available in the Releases section once the build completes." -ForegroundColor Cyan 