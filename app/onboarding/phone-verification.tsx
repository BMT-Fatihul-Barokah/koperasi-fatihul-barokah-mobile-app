import React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function PhoneVerificationScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');

  // Format phone to international string
  const formatPhoneNumber = (input: string) => {
    let cleaned = input.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
    if (cleaned.startsWith('62')) return `+${cleaned}`;
    return `+62${cleaned}`;
  };

  const handleContinue = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Mohon masukkan nomor telepon Anda');
      return;
    }

    // Use WhatsApp-only
    const internationalNumber = formatPhoneNumber(phoneNumber);
    // TODO: trigger WhatsApp OTP via Supabase
    router.push({
      pathname: '/onboarding/verification-code',
      params: { phoneNumber: internationalNumber, method: 'whatsapp' }
    });
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
        style={styles.continueButton}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>Lanjutkan</Text>
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
