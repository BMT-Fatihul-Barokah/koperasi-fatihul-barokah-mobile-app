import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { storage } from '../../lib/storage';

export default function VerificationCodeScreen() {
  const params = useLocalSearchParams<{ phoneNumber: string; method: string }>();
  
  const [phoneNumber, setPhoneNumber] = useState(params.phoneNumber || '');
  const method = params.method || 'sms';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  
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
  
  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[0];
    }
    
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    
    // Auto-advance to next input
    if (text !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyPress = (e: any, index: number) => {
    // Go back to previous input on backspace if current input is empty
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
  
  const handleVerify = async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      Alert.alert('Error', 'Mohon masukkan kode 6 digit lengkap');
      return;
    }
    
    if (!accountId) {
      Alert.alert('Error', 'Tidak dapat menemukan data akun. Silakan coba lagi.');
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
        Alert.alert('Error', 'Terjadi kesalahan saat verifikasi PIN. Silakan coba lagi.');
        setIsVerifying(false);
        return;
      }
      
      if (!account || !account.pin) {
        console.error('Account has no PIN set');
        Alert.alert('Error', 'Akun belum memiliki PIN. Silakan buat PIN baru.');
        router.push('/onboarding/security-setup');
        return;
      }
      
      // Verify PIN
      if (account.pin === fullCode) {
        console.log('PIN verification successful');
        
        try {
          // First clear any existing auth data
          await storage.removeItem('koperasi_auth_account_id');
          
          // Store the new account ID in secure storage for authentication
          await storage.setItem('koperasi_auth_account_id', accountId);
          
          // Small delay to ensure storage is updated before navigation
          setTimeout(() => {
            // Navigate to dashboard
            router.replace('/dashboard');
          }, 100);
        } catch (storageError) {
          console.error('Error updating auth storage:', storageError);
          Alert.alert('Error', 'Terjadi kesalahan saat menyimpan sesi. Silakan coba lagi.');
        }
      } else {
        console.error('Incorrect PIN');
        Alert.alert('Error', 'PIN yang Anda masukkan salah. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error during PIN verification:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat verifikasi PIN. Silakan coba lagi.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kode Verifikasi</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Masukkan PIN Anda</Text>
        <Text style={styles.subtitle}>
          Masukkan 6 digit PIN untuk akun dengan nomor telepon {phoneNumber}
        </Text>
        
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.codeInput}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>
        
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            {canResend 
              ? "Lupa PIN Anda?" 
              : `Lupa PIN? Tunggu ${timeLeft}d`
            }
          </Text>
          {canResend && (
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendButton}>Reset PIN</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.verifyButton, isVerifying && styles.disabledButton]}
        onPress={handleVerify}
        disabled={isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyButtonText}>Verifikasi PIN</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    fontSize: 16,
    color: '#007BFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendButton: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  verifyButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
