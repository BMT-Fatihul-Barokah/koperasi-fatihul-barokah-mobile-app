import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../components/error-boundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import { AuthProvider } from '../context/auth-context';
import { DataProvider } from '../context/data-context';
import { QueryProvider } from '../context/query-provider';
import { storage } from '../lib/storage';
import { Logger } from '../lib/logger';
import { DatabaseService } from '../lib/database.service';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'Sending `onAnimatedValueUpdate`',
  'Non-serializable values were found in the navigation state',
]);

// Keep splash screen visible while we initialize
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore errors */
});

// Auth constants
const AUTH_STORAGE_KEY = 'koperasi_auth_account_id';

// Root layout with integrated auth check
export default function RootLayout() {
  const [appState, setAppState] = useState({
    isLoading: true,
    isAuthenticated: false,
    error: null as Error | null,
  });

  // Check for existing session during splash screen
  useEffect(() => {
    async function checkAuthAndPrepareApp() {
      try {
        Logger.info('App', 'Initializing app and checking auth state');
        
        // Check for existing session
        const accountId = await storage.getItem(AUTH_STORAGE_KEY);
        
        if (accountId) {
          Logger.info('App', 'Found stored account ID, attempting to validate session', { accountId });
          
          // Validate the account ID by fetching account details
          const accountDetails = await DatabaseService.getAccountDetails(accountId);
          
          if (accountDetails) {
            Logger.info('App', 'Session validated successfully', { 
              accountId,
              memberId: accountDetails.member.id,
              memberName: accountDetails.member.nama
            });
            
            // Valid session found
            setAppState({
              isLoading: false,
              isAuthenticated: true,
              error: null
            });
          } else {
            Logger.warn('App', 'Invalid session found, redirecting to onboarding', { accountId });
            // Invalid session, clear it
            await storage.removeItem(AUTH_STORAGE_KEY);
            setAppState({
              isLoading: false,
              isAuthenticated: false,
              error: null
            });
          }
        } else {
          Logger.info('App', 'No session found, showing onboarding');
          // No session found
          setAppState({
            isLoading: false,
            isAuthenticated: false,
            error: null
          });
        }
        
        // Hide splash screen after auth check is complete
        await SplashScreen.hideAsync();
      } catch (error) {
        Logger.error('App', 'Error during app initialization', error);
        setAppState({
          isLoading: false,
          isAuthenticated: false,
          error: error as Error
        });
        await SplashScreen.hideAsync();
      }
    }

    checkAuthAndPrepareApp();
  }, []);

  // Show loading screen while checking auth
  if (appState.isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.text}>Memuat aplikasi...</Text>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (appState.error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="auto" />
        <Text style={styles.errorTitle}>Terjadi Kesalahan</Text>
        <Text style={styles.errorText}>
          {appState.error.message || 'Aplikasi tidak dapat dimuat.'}
        </Text>
      </View>
    );
  }

  // Store the authentication state in global context for use in index.tsx
  global.isAuthenticated = appState.isAuthenticated;
  
  // Render the app with a simple Slot
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <DataProvider>
              <Slot />
            </DataProvider>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F8',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
});
