import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../components/error-boundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';

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

// Simple app wrapper to diagnose issues
function AppWrapper({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Add a delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsReady(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Error initializing app:', e);
        setError(e as Error);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.text}>Memuat aplikasi...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="auto" />
        <Text style={styles.errorTitle}>Terjadi Kesalahan</Text>
        <Text style={styles.errorText}>
          {error.message || 'Aplikasi tidak dapat dimuat.'}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

// Simplified root layout
export default function RootLayout() {

  return (
    <ErrorBoundary>
      <AppWrapper>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: '#FFFFFF',
              },
              animation: 'none',
            }}
          />
        </SafeAreaProvider>
      </AppWrapper>
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
