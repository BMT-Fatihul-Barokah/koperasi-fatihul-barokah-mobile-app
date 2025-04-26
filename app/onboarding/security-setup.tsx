import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { storage } from '../../lib/storage';
import { DatabaseService } from '../../lib/database.service';
import { useAuth } from '../../context/auth-context';
import { Ionicons } from '@expo/vector-icons';

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
        setPin(prev => prev + key);
      }
    } else {
      if (key === 'del') {
        setConfirmPin(prev => prev.slice(0, -1));
      } else if (confirmPin.length < 6) {
        setConfirmPin(prev => prev + key);
      }
    }
  };
  
  useEffect(() => {
    if (pin.length === 6 && step === 'create') {
      // Automatically move to confirm step when PIN is complete
      setTimeout(() => {
        setStep('confirm');
      }, 300);
    }
  }, [pin, step]);
  
  // Load account ID from secure storage
  useEffect(() => {
    const loadAccountId = async () => {
      try {
        const storedAccountId = await storage.getItem('temp_account_id');
        if (storedAccountId) {
          setAccountId(storedAccountId);
        } else {
          // If no account ID is found, go back to account validation
          Alert.alert('Error', 'Data akun tidak ditemukan. Silakan coba lagi.');
          router.replace('/onboarding/account-validation');
        }
      } catch (error) {
        console.error('Error loading account ID:', error);
        Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
      }
    };

    loadAccountId();
  }, []);

  useEffect(() => {
    if (confirmPin.length === 6 && step === 'confirm') {
      // Verify PIN match
      if (pin === confirmPin) {
        // Save PIN to database
        savePinToDatabase(pin);
      } else {
        Alert.alert(
          'PIN Tidak Cocok',
          'PIN yang Anda masukkan tidak cocok. Silakan coba lagi.',
          [
            {
              text: 'OK',
              onPress: () => {
                setPin('');
                setConfirmPin('');
                setStep('create');
              },
            },
          ]
        );
      }
    }
  }, [confirmPin, pin, step]);

  const savePinToDatabase = async (pinToSave: string) => {
    if (!accountId) {
      Alert.alert('Error', 'Data akun tidak ditemukan. Silakan coba lagi.');
      return;
    }

    setIsLoading(true);

    try {
      // Save PIN to database
      const success = await DatabaseService.setAccountPin(accountId, pinToSave);
      
      if (!success) {
        Alert.alert('Error', 'Gagal menyimpan PIN. Silakan coba lagi.');
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
        Alert.alert('Error', 'Gagal masuk ke akun. Silakan coba lagi.');
        setIsLoading(false);
        return;
      }
      
      // Navigate to dashboard
      console.log('PIN setup complete, navigating to dashboard');
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error saving PIN:', error);
      Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan Keamanan</Text>
      </View>
      
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Menyimpan PIN Anda...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>
              {step === 'create' ? 'Buat PIN Anda' : 'Konfirmasi PIN Anda'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'create' 
                ? 'Buat PIN 6 digit untuk mengamankan akun Anda'
                : 'Silakan masukkan kembali PIN Anda untuk konfirmasi'
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
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pinDotFilled: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  keyButton: {
    width: '30%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  emptyButton: {
    backgroundColor: 'transparent',
  },
  keyButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButtonText: {
    fontSize: 24,
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
