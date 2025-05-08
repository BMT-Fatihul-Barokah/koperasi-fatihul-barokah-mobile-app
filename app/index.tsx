import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Logo from '../assets/logo.svg';
import { AuthService } from '../services/auth.service';
import { useAuth } from '../context/auth-context';
import { PinEntry } from '../components/auth/pin-entry';
import { PrimaryButton } from '../components/buttons/primary-button';

export default function LoginScreen() {
  // Auth states
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [step, setStep] = useState<'welcome' | 'phone' | 'pin'>('welcome');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { login } = useAuth();

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const { isLoggedIn, phoneNumber, accountId } = await AuthService.checkExistingSession();
        
        if (isLoggedIn && accountId) {
          // User is already logged in, redirect to dashboard
          const loginSuccess = await login(accountId);
          if (loginSuccess) {
            router.replace('/dashboard');
            return;
          }
        }
        
        if (phoneNumber) {
          // Phone number exists but not logged in, go to PIN entry
          setPhoneNumber(phoneNumber);
          setStep('pin');
        } else {
          // No phone number, show welcome screen
          setStep('welcome');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setStep('welcome');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  // Handle continue to phone verification
  const handleContinueToPhoneVerification = () => {
    // Navigate to the existing phone verification screen
    router.push('/onboarding/phone-verification');
  };

  // Handle PIN submission
  const handlePinSubmit = async (pin: string) => {
    if (!phoneNumber) return;
    
    try {
      setIsVerifying(true);
      setErrorMessage('');
      
      // Verify PIN
      const { success, accountId, message } = await AuthService.loginWithPhone(phoneNumber, pin);
      
      if (success && accountId) {
        // PIN is correct, login and redirect to dashboard
        const loginSuccess = await login(accountId);
        if (loginSuccess) {
          router.replace('/dashboard');
        } else {
          setErrorMessage('Gagal masuk ke akun. Silakan coba lagi.');
        }
      } else {
        // PIN is incorrect
        setErrorMessage(message);
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setErrorMessage('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle continue button press
  const handleContinue = () => {
    // Instead of setting step to 'phone', navigate directly to phone verification
    handleContinueToPhoneVerification();
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
      
      {step === 'phone' && (
        // This step is now handled by navigating to the phone-verification screen
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Redirecting...</Text>
        </View>
      )}
      
      {step === 'pin' && (
        <PinEntry 
          onPinComplete={handlePinSubmit}
          isLoading={isVerifying}
          errorMessage={errorMessage}
          pinLength={4}
          title="Masukkan PIN"
          subtitle="Masukkan PIN 4 digit Anda untuk masuk"
        />
      )}
    </SafeAreaView>
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
