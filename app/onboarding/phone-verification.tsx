import React, { useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Alert, 
  Keyboard, 
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { storage } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { BackHeader } from '../../components/header/back-header';
import { PrimaryButton } from '../../components/buttons/primary-button';
import { AuthService } from '../../services/auth.service';
import { useAuth } from '../../context/auth-context';

export default function PhoneVerificationScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if phone number is valid
  const isValidPhoneNumber = useMemo(() => {
    return phoneNumber.trim().length >= 9; // Minimum length for Indonesian phone numbers
  }, [phoneNumber]);

  // Format phone to international string
  const formatPhoneNumber = (input: string) => {
    let cleaned = input.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
    if (cleaned.startsWith('62')) return `+${cleaned}`;
    return `+62${cleaned}`;
  };

  const handleContinue = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Mohon masukkan nomor telepon Anda');
      return;
    }

    setIsLoading(true);
    
    try {
      // Format phone number but skip OTP verification
      const internationalNumber = formatPhoneNumber(phoneNumber);
      console.log('Formatted phone number:', internationalNumber);
      
      // Store phone number in secure storage for later use
      await storage.setItem('temp_phone_number', internationalNumber);
      
      // Check if phone number already exists in akun table using the auth service
      const account = await AuthService.findAccountByPhone(internationalNumber);
      
      if (account) {
        console.log('Existing account found:', account);
        
        // Store account ID for later use
        await storage.setItem('temp_account_id', account.id);
        
        if (account.pin) {
          // Account already has PIN, go to PIN verification
          console.log('Account has PIN, going to PIN verification');
          router.push('/onboarding/verification-code');
        } else {
          // Account exists but no PIN, go to PIN setup
          console.log('Account has no PIN, going to PIN setup');
          router.push('/onboarding/security-setup');
        }
      } else {
        // No existing account, go to account validation
        console.log('No existing account, going to account validation');
        router.push('/onboarding/account-validation');
      }
    } catch (error) {
      console.error('Error in phone verification:', error);
      Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to dismiss keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Reference to the text input
  const phoneInputRef = useRef<TextInput>(null);

  return (
    <SafeAreaProvider style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <BackHeader title="Verifikasi Nomor Telepon" />
            
            <View style={styles.content}>
              <Text style={styles.title}>Masuk atau Daftar</Text>
              <Text style={styles.subtitle}>
                Masukkan nomor telepon Anda untuk menerima kode verifikasi
              </Text>
              
              <Text style={styles.inputLabel}>Nomor Telepon</Text>
              
              {/* Phone input with static country code */}
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCode}>+62</Text>
                </View>
                <TextInput
                  ref={phoneInputRef}
                  style={styles.phoneInput}
                  placeholder="8xxxxxxxxxx"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  returnKeyType="done"
                  onSubmitEditing={dismissKeyboard}
                />
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <PrimaryButton 
                label="Lanjutkan"
                onPress={() => {
                  dismissKeyboard();
                  handleContinue();
                }}
                isDisabled={!isValidPhoneNumber}
                isLoading={isLoading}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    paddingTop: 40,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  countryCodeContainer: {
    height: '100%',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    height: '100%',
  },

});
