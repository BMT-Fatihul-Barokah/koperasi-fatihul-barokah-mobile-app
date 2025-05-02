/**
 * Supabase client configuration for React Native with Expo
 * Handles cross-platform storage and authentication
 */

// Required polyfill for React Native URL compatibility
import 'react-native-url-polyfill/auto';
// Secure storage for authentication persistence
import * as SecureStore from 'expo-secure-store';
// Platform detection for conditional logic
import { Platform } from 'react-native';
// Environment variables
import { env } from './env';

// Use dynamic import to avoid TypeScript errors
// @ts-ignore - Supabase import
const supabase_js = require('@supabase/supabase-js');
const createClient = supabase_js.createClient;

// Determine if we're running on web
const isWeb = Platform.OS === 'web';

// Create a storage adapter based on platform
const createStorageAdapter = () => {
  if (isWeb) {
    // Use localStorage for web
    return {
      getItem: (key: string) => {
        const value = localStorage.getItem(key);
        return Promise.resolve(value);
      },
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve(undefined);
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve(undefined);
      },
    };
  } else {
    // Use SecureStore for native mobile
    return {
      getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
      },
      setItem: (key: string, value: string) => {
        return SecureStore.setItemAsync(key, value);
      },
      removeItem: (key: string) => {
        return SecureStore.deleteItemAsync(key);
      },
    };
  }
};

// Get Supabase URL and keys from environment variables
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create storage adapter based on platform
const storageAdapter = createStorageAdapter();

// Create Supabase client with improved configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Global headers for all requests
  headers: {
    'Content-Type': 'application/json',
  },
  // Database configuration
  db: {
    schema: 'public',
  },
  // Add request timeout to prevent hanging requests
  realtime: {
    timeout: 10000, // 10 seconds
  },
});

// Create an admin client with service role key to bypass RLS policies
// This should only be used for operations that require admin privileges
// and never exposed to the client side
// Create an admin client with service role key (if available)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })
  : supabase; // Fallback to regular client if service key is not available

// Log platform and connection info for debugging
console.log(`Running on platform: ${Platform.OS}`);
console.log(`Supabase URL: ${supabaseUrl}`);


// Helper function to check connection with detailed error reporting
export async function checkSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Checking Supabase connection...');
    
    // First check if we can reach the Supabase API
    const timeoutPromise = new Promise<{ success: boolean; message: string }>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
    
    const connectionPromise = new Promise<{ success: boolean; message: string }>(async (resolve) => {
      try {
        const { data, error } = await supabase.from('anggota').select('id').limit(1);
        
        if (error) {
          console.error('Supabase query error:', error);
          resolve({ success: false, message: `Database error: ${error.message}` });
          return;
        }
        
        if (!data || !Array.isArray(data)) {
          console.error('Unexpected data format:', data);
          resolve({ success: false, message: 'Unexpected data format from server' });
          return;
        }
        
        console.log('Supabase connection successful');
        resolve({ success: true, message: 'Connection successful' });
      } catch (err) {
        console.error('Supabase connection error:', err);
        resolve({ success: false, message: `Connection error: ${err instanceof Error ? err.message : String(err)}` });
      }
    });
    
    // Race between timeout and connection
    return await Promise.race([connectionPromise, timeoutPromise]);
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return { 
      success: false, 
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
