import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { router, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../components/error-boundary';
import { Logger } from '../lib/logger';
import { useAuth } from '../context/auth-context';

// Access the global authentication state
declare global {
  var isAuthenticated: boolean;
}

export default function RootScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }
  
  // Use declarative navigation with Redirect
  if (isAuthenticated) {
    Logger.info('Index', 'User is authenticated, redirecting to dashboard');
    return <Redirect href="/dashboard" />
  } else {
    Logger.info('Index', 'User is not authenticated, redirecting to onboarding');
    return <Redirect href="/onboarding" />
  }
  
  // Simplified continue button handler
  const handleContinue = () => {
    try {
      Logger.info('App', 'User starting onboarding flow');
      setIsLoading(true);
      // Simple navigation without complex logic
      setTimeout(() => {
        router.push('/onboarding/phone-verification');
      }, 500);
    } catch (error) {
      console.error('Navigation error:', error);
      setIsLoading(false);
    }
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }

  // Simplified welcome screen
  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        <View style={styles.imageContainer}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Selamat Datang di BMT Fatihul Barokah</Text>
          <Text style={styles.subtitle}>
            Kelola tabungan, pembiayaan, dan informasi keuangan Anda dengan mudah
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Lanjutkan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  logo: {
    width: 280,
    height: 280,
    marginBottom: 20,
    marginTop: 50,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
