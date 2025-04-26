import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { storage } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

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
        
        // Get anggota details to ensure we're loading the correct user data
        const { data: anggota, error: anggotaError } = await supabase
          .from('anggota')
          .select('id, nama, nomor_rekening')
          .eq('id', existingAccount.anggota_id)
          .single();
        
        if (anggotaError) {
          console.error('Error fetching anggota details:', anggotaError);
          Alert.alert('Error', 'Terjadi kesalahan saat memuat data anggota. Silakan coba lagi.');
          setIsLoading(false);
          return;
        }
        
        console.log('Anggota details:', anggota);
        
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verifikasi Nomor Telepon</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Verifikasi Nomor Telepon</Text>
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
            style={styles.phoneInput}
            placeholder="8xxxxxxxxxx"
            placeholderTextColor="#999"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    paddingTop: 40,
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
  continueButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    height: 56,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
