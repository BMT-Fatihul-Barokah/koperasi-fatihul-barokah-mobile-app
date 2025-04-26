import React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { storage } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

export default function PhoneVerificationScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      
      // Check if phone number already exists in akun table
      const { data: existingAccount, error } = await supabase
        .from('akun')
        .select('id, anggota_id, pin')
        .eq('nomor_telepon', internationalNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error checking existing account:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat memeriksa akun. Silakan coba lagi.');
        setIsLoading(false);
        return;
      }
      
      if (existingAccount) {
        console.log('Existing account found:', existingAccount);
        
        // Store account ID for later use
        await storage.setItem('temp_account_id', existingAccount.id);
        
        if (existingAccount.pin) {
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

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verifikasi Nomor Telepon</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Masukkan nomor telepon Anda</Text>
        <Text style={styles.subtitle}>
          Kami akan mengirimkan kode verifikasi untuk mengkonfirmasi identitas Anda
        </Text>
        
        {/* Phone input with static country code */}
        <View style={styles.phoneInputContainer}>
          <Text style={styles.countryCode}>+62</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="8xxxxxxxxxx"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.continueButton, isLoading && styles.disabledButton]}
        onPress={handleContinue}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.continueButtonText}>Lanjutkan</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  countryCode: {
    fontSize: 16,
    marginRight: 8,
  },
  continueButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
