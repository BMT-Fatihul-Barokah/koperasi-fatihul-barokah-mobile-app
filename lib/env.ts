import Constants from 'expo-constants';

/**
 * Environment variables utility
 * Safely access environment variables with fallbacks
 */

interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

// Get environment variables from Expo Constants
// These are loaded from app.config.js/app.json which can reference process.env
const expoConstants = Constants.expoConfig?.extra;

// Create environment object with fallbacks
export const env: Env = {
  // Use environment variables from Expo Constants
  NEXT_PUBLIC_SUPABASE_URL: 
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    expoConstants?.SUPABASE_URL ||
    '',
  
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    expoConstants?.SUPABASE_ANON_KEY ||
    '',
};

// Validate environment variables
if (!env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing Supabase URL environment variable');
}

if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase Anon Key environment variable');
}

// Log environment variables for debugging (only show partial key for security)
console.log('Supabase URL:', env.NEXT_PUBLIC_SUPABASE_URL);
if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('Supabase Anon Key:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...');
}
