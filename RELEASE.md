# Release Guide for Koperasi Fatihul Barokah Mobile App

This guide explains how to create production builds and releases for the mobile app.

## 🚀 Quick Release (Recommended)

### Option 1: Using the Release Script

**For Windows (PowerShell):**

```powershell
./scripts/create-release.ps1 v1.0.0
```

**For macOS/Linux (Bash):**

```bash
chmod +x scripts/create-release.sh
./scripts/create-release.sh v1.0.0
```

This script will:

1. Update the version in `package.json`
2. Commit the changes
3. Create and push a git tag
4. Trigger the GitHub Actions workflow automatically

### Option 2: Manual Tag Creation

1. Update version in `package.json`:

      ```bash
      npm version 1.0.0 --no-git-tag-version
      ```

2. Commit and push:

      ```bash
      git add package.json package-lock.json
      git commit -m "Bump version to v1.0.0"
      git push origin main
      ```

3. Create and push tag:
      ```bash
      git tag v1.0.0
      git push origin v1.0.0
      ```

## 🔧 Build Methods

### Method 1: Local Build (Primary)

The app will be built locally on GitHub's servers without using EAS cloud services.

**Workflow:** `.github/workflows/build-and-release.yml`

**Triggers:**

- Automatically when you push a tag (e.g., `v1.0.0`)
- Manually from GitHub Actions tab

**Process:**

1. Sets up Node.js, Java, and Android SDK
2. Installs dependencies
3. Runs `expo prebuild` to generate native Android code
4. Builds APK using Gradle
5. Creates GitHub release with APK

### Method 2: EAS Build (Fallback)

If the local build fails, you can use EAS build as a fallback.

**Workflow:** `.github/workflows/build-with-eas.yml`

**Setup Required:**

1. Get your Expo access token:

      ```bash
      npx expo login
      npx expo whoami --json
      ```

2. Add `EXPO_TOKEN` to your GitHub repository secrets:
      - Go to Settings > Secrets and variables > Actions
      - Add new secret: `EXPO_TOKEN` with your token value

**Triggers:**

- Manual only (from GitHub Actions tab)

**Process:**

1. Builds using EAS cloud services
2. Downloads the APK
3. Creates GitHub release with APK

## 📱 Manual Release Process

If GitHub Actions fails, you can create releases manually:

### Local Build

```bash
# Install dependencies
npm install

# Create production build
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### EAS Build

```bash
# Build with EAS
eas build --platform android --profile production

# Download from the provided URL
```

## 🔄 GitHub Actions Workflows

### Automatic Release (build-and-release.yml)

- **Trigger:** Push tag matching `v*`
- **Environment:** Ubuntu latest
- **Build method:** Local (expo prebuild + gradle)
- **Output:** APK in GitHub Releases

### Manual EAS Release (build-with-eas.yml)

- **Trigger:** Manual dispatch only
- **Environment:** Ubuntu latest
- **Build method:** EAS Cloud Build
- **Output:** APK in GitHub Releases
- **Requires:** EXPO_TOKEN secret

## 📋 Release Checklist

Before creating a release:

- [ ] Test the app thoroughly
- [ ] Update version in `package.json`
- [ ] Update any changelog or release notes
- [ ] Ensure all environment variables are set correctly
- [ ] Test the build process locally (optional)

## 🛠️ Troubleshooting

### Build Fails on GitHub Actions

1. Check the Actions tab for error logs
2. Common issues:
      - Missing environment variables
      - Dependency conflicts
      - Android SDK issues

### EAS Build Issues

1. Verify your Expo account has build credits
2. Check that `EXPO_TOKEN` is valid and has proper permissions
3. Ensure `eas.json` configuration is correct

### APK Installation Issues

1. Enable "Install from unknown sources" on Android
2. Check that the APK is not corrupted
3. Verify Android version compatibility

## 📞 Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Review the error messages
3. Ensure all prerequisites are met
4. Try the fallback EAS build method

## 🔐 Security Notes

- Environment variables are securely handled in GitHub Actions
- APK files are signed for release
- Supabase keys are configured for production use

---

**Next Steps After Release:**

1. Test the APK on a real device
2. Share the download link from GitHub Releases
3. Monitor for any issues or feedback
4. Plan the next version improvements
