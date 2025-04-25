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
const expoConstants = Constants.expoConfig?.extra;

// Create environment object with fallbacks to process.env
export const env: Env = {
  // Always use the hardcoded values to ensure consistency across platforms
  NEXT_PUBLIC_SUPABASE_URL: 'https://hyiwhckxwrngegswagrb.supabase.co',
  
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXdoY2t4d3JuZ2Vnc3dhZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4MzcsImV4cCI6MjA2MTA3MjgzN30.bpDSX9CUEA0F99x3cwNbeTVTVq-NHw5GC5jmp2QqnNM',
};

// Log environment variables for debugging
console.log('Supabase URL:', env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Anon Key:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...');
