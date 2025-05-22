import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, InteractionManager } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Logo from '../assets/logo.svg';
import { AuthService } from '../services/auth.service';
import { useAuth } from '../context/auth-context';
import { PrimaryButton } from '../components/buttons/primary-button';
import { SafeRender } from '../components/safe-render';
import { ErrorBoundary } from '../components/error-boundary';

function LoginScreenContent() {
  // Auth states
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'welcome' | 'loading'>('welcome');
  const { login } = useAuth();

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const { isLoggedIn, accountId } = await AuthService.checkExistingSession();
        
        if (isLoggedIn && accountId) {
          // User is already logged in, redirect to dashboard
          const loginSuccess = await login(accountId);
          if (loginSuccess) {
            router.replace('/dashboard');
            return;
          }
        }
        
        // No active session, show welcome screen
        setStep('welcome');
      } catch (error) {
        console.error('Error checking session:', error);
        setStep('welcome');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  // Handle continue button press
  const handleContinue = () => {
    // Navigate directly to phone verification
    router.push('/onboarding/phone-verification');
  };

  // Show loading indicator while checking session
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {step === 'welcome' && (
        <>
          <View style={styles.imageContainer}>
            <Logo 
              width={300}
              height={300}
              style={styles.logo} 
            />
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Selamat Datang di BMT Fatihul Barokah</Text>
            <Text style={styles.subtitle}>
              Kelola tabungan, pembiayaan, dan informasi keuangan Anda dengan mudah
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <View style={styles.buttonWrapper}>
              <PrimaryButton 
                label="Lanjutkan"
                onPress={handleContinue}
              />
            </View>
          </View>
        </>
      )}
      
      {step === 'loading' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Memuat...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Wrap the component with ErrorBoundary and SafeRender to prevent "unknown view tag" errors
export default function LoginScreen() {
  return (
    <ErrorBoundary>
      <SafeRender delay={100}>
        <LoginScreenContent />
      </SafeRender>
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
    marginBottom: 20
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
  },
  buttonWrapper: {
    width: '100%',
  }
});
