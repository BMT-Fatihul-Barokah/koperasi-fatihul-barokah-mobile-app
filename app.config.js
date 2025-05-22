const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const env = process.env.EAS_BUILD 
  ? process.env 
  : dotenv.config({ path: path.resolve(__dirname, '.env') }).parsed || {};

// Handle potential undefined values
const safeEnv = {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || '',
};

export default {
  name: "Koperasi Fatihul Barokah",
  slug: "koperasi-fatihul-barokah-mobile-apps",
  version: "0.9.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "kfb",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#007BFF"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    package: "com.fatihulbarokah.koperasi",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#007BFF"
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  // Pass environment variables to the app securely
  extra: {
    SUPABASE_URL: safeEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: safeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: safeEnv.SUPABASE_SERVICE_ROLE_KEY,
    eas: {
      projectId: "7f50e699-bd38-4115-99dd-759fafda7a3e"
    },
  },
  // Add development client configuration
  developmentClient: {
    silentLaunch: false,
  },
  // Define public environment variables
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
        },
        android: {
          compileSdkVersion: 33,
          targetSdkVersion: 33,
          buildToolsVersion: "33.0.0",
        },
      },
    ],
    "expo-secure-store",
  ],
};
