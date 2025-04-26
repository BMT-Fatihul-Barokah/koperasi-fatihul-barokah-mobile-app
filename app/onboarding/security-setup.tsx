import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { storage } from '../../lib/storage';
import { DatabaseService } from '../../lib/database.service';
import { useAuth } from '../../context/auth-context';
import { BackHeader } from '../../components/header/back-header';
import Toast from 'react-native-toast-message';

interface PinKeypadProps {
  onKeyPress: (key: string) => void;
}

const PinKeypad = ({ onKeyPress }: PinKeypadProps) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  
  return (
    <View style={styles.keypadContainer}>
      {keys.map((key, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.keyButton,
            key === '' && styles.emptyButton,
          ]}
          onPress={() => key && onKeyPress(key)}
          disabled={key === ''}
        >
          {key === 'del' ? (
            <Text style={styles.deleteButtonText}>⌫</Text>
          ) : (
            <Text style={styles.keyButtonText}>{key}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function SecuritySetupScreen() {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accountId, setAccountId] = useState<string>('');
  const { login } = useAuth();
  
  const handleKeyPress = (key: string) => {
    if (step === 'create') {
      if (key === 'del') {
        setPin(prev => prev.slice(0, -1));
      } else if (pin.length < 6) {
        const newPin = pin + key;
        setPin(newPin);
        
        // Auto-advance to confirm step when PIN is complete
        if (newPin.length === 6) {
          setTimeout(() => {
            setStep('confirm');
          }, 300);
        }
      }
    } else {
      if (key === 'del') {
        setConfirmPin(prev => prev.slice(0, -1));
      } else if (confirmPin.length < 6) {
        const newConfirmPin = confirmPin + key;
        setConfirmPin(newConfirmPin);
        
        // Auto-verify when confirm PIN is complete
        if (newConfirmPin.length === 6) {
          setTimeout(() => {
            // Verify PIN match
            if (pin === newConfirmPin) {
              // Save PIN to database
              savePinToDatabase(pin);
            } else {
              Toast.show({
                type: 'error',
                text1: 'PIN Tidak Cocok',
                text2: 'PIN yang Anda masukkan tidak cocok. Silakan coba lagi.',
                position: 'bottom'
              });
              // Reset inputs
              setPin('');
              setConfirmPin('');
              setStep('create');
            }
          }, 300);
        }
      }
    }
  };
  
  // Load account ID from secure storage
  useEffect(() => {
    const loadAccountId = async () => {
      try {
        const storedAccountId = await storage.getItem('temp_account_id');
        if (storedAccountId) {
          setAccountId(storedAccountId);
        } else {
          // If no account ID is found, go back to account validation
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Data akun tidak ditemukan. Silakan coba lagi.',
            position: 'bottom'
          });
          router.replace('/onboarding/account-validation');
        }
      } catch (error) {
        console.error('Error loading account ID:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Terjadi kesalahan. Silakan coba lagi.',
          position: 'bottom'
        });
      }
    };

    loadAccountId();
  }, []);

  const savePinToDatabase = async (pinToSave: string) => {
    if (!accountId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Data akun tidak ditemukan. Silakan coba lagi.',
        position: 'bottom'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save PIN to database
      const success = await DatabaseService.setAccountPin(accountId, pinToSave);
      
      if (!success) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Gagal menyimpan PIN. Silakan coba lagi.',
          position: 'bottom'
        });
        setIsLoading(false);
        return;
      }

      // Clean up temporary storage
      await storage.removeItem('temp_phone_number');
      await storage.removeItem('temp_account_id');
      
      // Store account ID for authentication
      await storage.setItem('koperasi_auth_account_id', accountId);
      
      // Log in the user with the new account ID
      const loginSuccess = await login(accountId);
      
      if (!loginSuccess) {
        console.error('Failed to login after PIN setup');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Gagal masuk ke akun. Silakan coba lagi.',
          position: 'bottom'
        });
        setIsLoading(false);
        return;
      }
      
      // Navigate to dashboard
      console.log('PIN setup complete, navigating to dashboard');
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error saving PIN:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Terjadi kesalahan. Silakan coba lagi.',
        position: 'bottom'
      });
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaProvider style={styles.container}>
      <BackHeader title="Pengaturan Keamanan" />
      
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Menyimpan PIN Anda...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>
              {step === 'create' ? 'Masukkan PIN' : 'Konfirmasi PIN'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'create' 
                ? 'Masukkan 6 digit PIN kamu'
                : 'Masukkan kembali PIN kamu untuk konfirmasi'
              }
            </Text>
        
        <View style={styles.pinContainer}>
          {Array(6).fill(0).map((_, index) => {
            const currentPin = step === 'create' ? pin : confirmPin;
            const isFilled = index < currentPin.length;
            
            return (
              <View 
                key={index} 
                style={[
                  styles.pinDot,
                  isFilled && styles.pinDotFilled
                ]}
              />
            );
          })}
        </View>
        
        <PinKeypad onKeyPress={handleKeyPress} />
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            PIN Anda akan digunakan untuk mengamankan akun dan mengotorisasi transaksi.
          </Text>
        </View>
        </>
        )}
      </View>
      
      <Toast />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    margin: 10,
  },
  pinDotFilled: {
    backgroundColor: '#4CD2C8',
  },
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 340,
    marginTop: 30,
    paddingHorizontal: 10,
  },
  keyButton: {
    width: '28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '2.5%',
    borderRadius: 50,
    backgroundColor: '#f8f8f8',
  },
  emptyButton: {
    backgroundColor: 'transparent',
  },
  keyButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButtonText: {
    fontSize: 28,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginTop: 40,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#007BFF',
    textAlign: 'center',
  },
});
