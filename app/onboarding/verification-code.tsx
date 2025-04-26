import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { storage } from '../../lib/storage';
import { BackHeader } from '../../components/header/back-header';
import { useAuth } from '../../context/auth-context';
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

export default function VerificationCodeScreen() {
  const params = useLocalSearchParams<{ phoneNumber: string; method: string }>();
  const { login } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState(params.phoneNumber || '');
  const method = params.method || 'sms';
  
  const [pin, setPin] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  
  // Load phone number and account ID from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedPhoneNumber = await storage.getItem('temp_phone_number');
        const storedAccountId = await storage.getItem('temp_account_id');
        
        if (storedPhoneNumber) {
          setPhoneNumber(storedPhoneNumber);
        }
        
        if (storedAccountId) {
          setAccountId(storedAccountId);
          console.log('Loaded account ID:', storedAccountId);
        } else {
          console.error('No account ID found in storage');
          Alert.alert('Error', 'Tidak dapat menemukan data akun. Silakan coba lagi.');
          router.replace('/onboarding/phone-verification');
        }
      } catch (error) {
        console.error('Error loading data from storage:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat memuat data. Silakan coba lagi.');
      }
    };
    
    loadData();
  }, []);
  
  // Timer for resend code
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const handleKeyPress = (key: string) => {
    if (key === 'del') {
      // Delete the last digit
      if (pin.length > 0) {
        setPin(pin.slice(0, -1));
      }
    } else {
      // Add digit if we have less than 6 digits
      if (pin.length < 6) {
        const newPin = pin + key;
        setPin(newPin);
        
        // Auto-verify when PIN is complete
        if (newPin.length === 6) {
          setTimeout(() => {
            handleVerify(newPin);
          }, 300);
        }
      }
    }
  };
  
  const handleResendCode = () => {
    if (!canResend) return;
    
    // Reset timer
    setTimeLeft(60);
    setCanResend(false);
    
    // In a real app, we would resend the verification code here
    // For now, just show an alert
    Alert.alert(
      'Lupa PIN?', 
      'Jika Anda lupa PIN, silakan hubungi customer service kami untuk mereset PIN Anda.',
      [
        { text: 'OK' },
        { 
          text: 'Hubungi CS', 
          onPress: () => {
            // In a real app, this would open the phone app or WhatsApp
            Alert.alert('Info', 'Fitur ini akan tersedia segera.');
          } 
        }
      ]
    );
  };
  
  const handleVerify = async (inputPin: string = pin) => {
    if (inputPin.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Mohon masukkan kode 6 digit lengkap',
        position: 'bottom'
      });
      return;
    }
    
    if (!accountId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Tidak dapat menemukan data akun. Silakan coba lagi.',
        position: 'bottom'
      });
      return;
    }
    
    setIsVerifying(true);
    
    try {
      console.log(`Verifying PIN for account ID: ${accountId}`);
      
      // Get account details to check PIN
      const { data: account, error } = await supabase
        .from('akun')
        .select('pin')
        .eq('id', accountId)
        .single();
      
      if (error) {
        console.error('Error fetching account for PIN verification:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Terjadi kesalahan saat verifikasi PIN. Silakan coba lagi.',
          position: 'bottom'
        });
        setIsVerifying(false);
        return;
      }
      
      if (!account || !account.pin) {
        console.error('Account has no PIN set');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Akun belum memiliki PIN. Silakan buat PIN baru.',
          position: 'bottom'
        });
        router.push('/onboarding/security-setup');
        return;
      }
      
      // Verify PIN
      if (account.pin === inputPin) {
        console.log('PIN verification successful');
        
        try {
          // First clear any existing auth data
          await storage.removeItem('koperasi_auth_account_id');
          
          // Store the new account ID in secure storage for authentication
          await storage.setItem('koperasi_auth_account_id', accountId);
          
          // Use the login function from auth context to properly load the user data
          const loginSuccess = await login(accountId);
          
          if (loginSuccess) {
            // Navigate directly to dashboard with the updated user data
            router.replace('/dashboard');
          } else {
            console.error('Failed to login with the new account ID');
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Gagal memuat data pengguna. Silakan coba lagi.',
              position: 'bottom'
            });
          }
        } catch (storageError) {
          console.error('Error updating auth storage:', storageError);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Terjadi kesalahan saat menyimpan sesi. Silakan coba lagi.',
            position: 'bottom'
          });
        }
      } else {
        console.error('Incorrect PIN');
        Toast.show({
          type: 'error',
          text1: 'PIN Salah',
          text2: 'PIN yang Anda masukkan salah. Silakan coba lagi.',
          position: 'bottom'
        });
        // Reset PIN input when incorrect
        setPin('');
      }
    } catch (error) {
      console.error('Error during PIN verification:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Terjadi kesalahan saat verifikasi PIN. Silakan coba lagi.',
        position: 'bottom'
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <SafeAreaProvider style={styles.container}>
      <BackHeader title="Masukkan PIN" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Masukkan PIN</Text>
        <Text style={styles.subtitle}>
          Masukkan 6 digit PIN kamu
        </Text>
        
        <View style={styles.pinContainer}>
          {Array(6).fill(0).map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.pinDot,
                index < pin.length && styles.pinDotFilled
              ]}
            />
          ))}
        </View>
        
        <PinKeypad onKeyPress={handleKeyPress} />
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.optionButton}>Gunakan Akun Lain</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleResendCode}>
            <Text style={styles.optionButton}>Gunakan Password</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 40,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  optionButton: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: 'bold',
  }
});
