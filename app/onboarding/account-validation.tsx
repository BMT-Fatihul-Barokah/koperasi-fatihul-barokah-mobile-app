import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import { DatabaseService } from '../../lib/database.service';
import { checkSupabaseConnection } from '../../lib/supabase';
import { storage } from '../../lib/storage';

export default function AccountValidationScreen() {
  const [fullName, setFullName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Load phone number from secure storage
  useEffect(() => {
    const loadPhoneNumber = async () => {
      try {
        const storedPhoneNumber = await storage.getItem('temp_phone_number');
        if (storedPhoneNumber) {
          setPhoneNumber(storedPhoneNumber);
        } else {
          // If no phone number is found, go back to phone verification
          Alert.alert('Error', 'Nomor telepon tidak ditemukan. Silakan coba lagi.');
          router.replace('/onboarding/phone-verification');
        }
      } catch (error) {
        console.error('Error loading phone number:', error);
        Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
      }
    };

    loadPhoneNumber();
  }, []);

  const handleValidate = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Mohon masukkan nama lengkap Anda');
      return;
    }

    if (!accountNumber.trim()) {
      Alert.alert('Error', 'Mohon masukkan nomor rekening Anda');
      return;
    }

    setIsValidating(true);

    try {
      // Check network connectivity first
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        Alert.alert(
          'Kesalahan Jaringan',
          'Tidak ada koneksi internet. Silakan periksa koneksi Anda dan coba lagi.'
        );
        setIsValidating(false);
        return;
      }

      // Check Supabase connection with detailed error reporting
      const connectionCheck = await checkSupabaseConnection();
      if (!connectionCheck.success) {
        console.error('Connection check failed:', connectionCheck.message);
        Alert.alert(
          'Kesalahan Server',
          `Tidak dapat terhubung ke server: ${connectionCheck.message}. Silakan coba lagi nanti.`
        );
        setIsValidating(false);
        return;
      }
      
      console.log('Connection check passed:', connectionCheck.message);
      
      // Log validation attempt for debugging
      console.log(`Attempting to validate account: ${fullName} with rekening: ${accountNumber}`);
      
      // Validate account against database
      const anggota = await DatabaseService.validateAccount(fullName, accountNumber);
      
      if (!anggota) {
        Alert.alert('Error', 'Akun tidak ditemukan. Pastikan nama lengkap dan nomor rekening benar.');
        setIsValidating(false);
        return;
      }
      
      console.log('Account validated successfully:', anggota.id);

      // Create or update account with phone number
      try {
        const account = await DatabaseService.createOrUpdateAccount(anggota.id, phoneNumber);
        
        if (!account) {
          // This means the anggota is already linked to another phone number
          // or the phone number is already linked to another anggota
          Alert.alert(
            'Akun Sudah Terdaftar', 
            'Anggota ini sudah terhubung dengan nomor telepon lain. Silakan gunakan nomor telepon yang terdaftar sebelumnya atau hubungi admin koperasi untuk bantuan.'
          );
          setIsValidating(false);
          return;
        }
        
        console.log('Account created/updated successfully:', account.id);

        // Check if PIN exists
        if (account.pin) {
          // PIN already exists, go to dashboard
          await storage.setItem('koperasi_auth_account_id', account.id);
          console.log('Navigating to dashboard...');
          router.replace('/dashboard');
        } else {
          // Store account ID for PIN setup
          await storage.setItem('temp_account_id', account.id);
          console.log('Navigating to security setup...');
          router.push('/onboarding/security-setup');
        }
      } catch (accountError) {
        console.error('Error creating/updating account:', accountError);
        Alert.alert('Error', 'Gagal membuat atau memperbarui akun. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error validating account:', error);
      if (error instanceof Error && error.message === 'Network request failed') {
        Alert.alert(
          'Kesalahan Jaringan', 
          'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.'
        );
      } else {
        Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleNewAccount = () => {
    // Navigate to the new customer registration flow
    router.push('/onboarding/new-account');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validasi Akun</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Validasi akun Anda</Text>
        <Text style={styles.subtitle}>
          Mohon masukkan nama lengkap Anda sesuai dengan yang terdaftar di koperasi dan nomor rekening Anda
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nama Lengkap</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan nama lengkap Anda"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nomor Rekening</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan nomor rekening Anda"
            keyboardType="number-pad"
            value={accountNumber}
            onChangeText={setAccountNumber}
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Catatan: Sistem memvalidasi data yang diperbarui setiap hari pukul 15.00. Transaksi setelah waktu ini akan tercermin pada hari berikutnya.
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.validateButton, isValidating && styles.disabledButton]}
          onPress={handleValidate}
          disabled={isValidating}
        >
          {isValidating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.validateButtonText}>Validasi Akun</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.newAccountButton}
          onPress={handleNewAccount}
        >
          <Text style={styles.newAccountButtonText}>Daftar Rekening BMT Fatihul Barokah</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  contentContainer: {
    padding: 20,
    flexGrow: 1,
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#007BFF',
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  validateButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newAccountButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007BFF',
  },
  newAccountButtonText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
