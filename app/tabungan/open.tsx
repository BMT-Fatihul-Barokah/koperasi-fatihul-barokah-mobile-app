import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { TabunganService } from '../../services/tabungan.service';
import { formatCurrency } from '../../lib/format-utils';
import { Ionicons } from '@expo/vector-icons';

export default function OpenTabunganScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    jenisId: string;
    jenisKode: string;
    jenisNama: string;
    minimumSetoran: string;
    anggotaId: string;
  }>();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [setoranAwal, setSetoranAwal] = useState(params.minimumSetoran || '0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Format input as currency
  const formatInput = (text: string) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    setSetoranAwal(numericValue);
  };
  
  // Format for display
  const getFormattedAmount = () => {
    const amount = parseInt(setoranAwal) || 0;
    return formatCurrency(amount);
  };
  
  // Check if setoran awal meets minimum requirement
  const isSetoranValid = () => {
    const amount = parseInt(setoranAwal) || 0;
    const minimum = parseInt(params.minimumSetoran) || 0;
    return amount >= minimum;
  };
  
  // Handle submit
  const handleSubmit = async () => {
    if (!isSetoranValid()) {
      Alert.alert(
        'Setoran Tidak Valid',
        `Setoran awal harus minimal ${formatCurrency(parseInt(params.minimumSetoran) || 0)}`
      );
      return;
    }
    
    if (!params.anggotaId || !params.jenisKode) {
      Alert.alert('Error', 'Data tidak lengkap');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const result = await TabunganService.bukaTabungan(
        params.anggotaId,
        params.jenisKode,
        parseInt(setoranAwal)
      );
      
      if (result.success) {
        Alert.alert(
          'Sukses',
          `${result.message}\nNomor Rekening: ${result.nomorRekening || '-'}`,
          [
            {
              text: 'Lihat Detail',
              onPress: () => {
                if (result.tabunganId) {
                  router.replace(`/tabungan/${result.tabunganId}`);
                } else {
                  router.replace('/tabungan');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Gagal', result.message);
      }
    } catch (error) {
      console.error('Error opening tabungan:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat membuka rekening tabungan');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          title: 'Buka Rekening Baru',
          headerStyle: {
            backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
          },
          headerShadowVisible: false,
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informasi Rekening</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Jenis Tabungan</Text>
              <Text style={styles.infoValue}>{params.jenisNama}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Kode</Text>
              <Text style={styles.infoValue}>{params.jenisKode}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Minimum Setoran Awal</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(parseInt(params.minimumSetoran) || 0)}
              </Text>
            </View>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Setoran Awal</Text>
            <Text style={styles.cardDescription}>
              Masukkan jumlah setoran awal untuk membuka rekening tabungan ini
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>Rp</Text>
              <TextInput
                style={styles.input}
                value={setoranAwal}
                onChangeText={formatInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            
            <Text style={styles.formattedAmount}>{getFormattedAmount()}</Text>
            
            {!isSetoranValid() && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color="#e01b24" />
                <Text style={styles.errorText}>
                  Setoran awal harus minimal {formatCurrency(parseInt(params.minimumSetoran) || 0)}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isSetoranValid() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isSetoranValid() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Buka Rekening</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  formattedAmount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(224, 27, 36, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#e01b24',
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
