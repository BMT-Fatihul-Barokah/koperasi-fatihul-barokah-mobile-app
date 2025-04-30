import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackHeader } from '../../../components/header/back-header';

export default function SubmissionConfirmationScreen() {
  // Get the submission ID from route params
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  
  // Fallback to a generated ID if none was provided (shouldn't happen in normal flow)
  const displaySubmissionId = submissionId || `REG-${Math.floor(10000 + Math.random() * 90000)}`;
  
  const handleGoToLogin = () => {
    // Navigate back to the main login screen
    router.replace('/');
  };
  
  return (
    <SafeAreaProvider>
      <BackHeader title="Konfirmasi Pendaftaran" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        
        <Text style={styles.title}>Pendaftaran Terkirim!</Text>
        <Text style={styles.subtitle}>
          Data pendaftaran anggota Anda telah berhasil dikirim untuk ditinjau.
        </Text>
        
        <View style={styles.submissionIdContainer}>
          <Text style={styles.submissionIdLabel}>ID Pendaftaran:</Text>
          <Text style={styles.submissionId}>{displaySubmissionId}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Langkah Selanjutnya</Text>
          <Text style={styles.infoText}>
            • Tim kami akan meninjau pendaftaran Anda dalam 1-2 hari kerja
          </Text>
          <Text style={styles.infoText}>
            • Anda akan menerima notifikasi melalui SMS atau WhatsApp tentang status pendaftaran
          </Text>
          <Text style={styles.infoText}>
            • Silakan kunjungi kantor kami dengan dokumen asli untuk menyelesaikan proses pendaftaran
          </Text>
          <Text style={styles.infoText}>
            • Simpan ID pendaftaran Anda untuk referensi
          </Text>
        </View>
        
        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>Butuh Bantuan?</Text>
          <Text style={styles.contactText}>
            Jika Anda memiliki pertanyaan, silakan hubungi layanan pelanggan kami:
          </Text>
          <Text style={styles.contactInfo}>Telepon: 021-XXXX-XXXX</Text>
          <Text style={styles.contactInfo}>Email: info@koperasifatihulbarokah.com</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.doneButton}
        onPress={handleGoToLogin}
      >
        <Text style={styles.doneButtonText}>Kembali ke Beranda</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  successIcon: {
    fontSize: 50,
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#007BFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 22,
  },
  submissionIdContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  submissionIdLabel: {
    fontSize: 16,
    color: '#333',
  },
  submissionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#007BFF',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  contactContainer: {
    width: '100%',
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007BFF',
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 14,
    color: '#007BFF',
    marginBottom: 5,
  },
  doneButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
