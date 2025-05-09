import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { JenisTabungan } from '../../lib/database.types';
import { TabunganService } from '../../services/tabungan.service';
import { JenisTabunganList } from '../../components/tabungan/jenis-tabungan-list';
import { storage } from '../../lib/storage';
import { DatabaseService } from '../../lib/database.service';

export default function NewTabunganScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [jenisTabungan, setJenisTabungan] = useState<JenisTabungan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [anggotaId, setAnggotaId] = useState<string | null>(null);
  
  // Fetch jenis tabungan
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Get account details to get anggota_id
        const accountId = await storage.getItem('koperasi_auth_account_id');
        if (!accountId) {
          router.replace('/');
          return;
        }
        
        const accountDetails = await DatabaseService.getAccountDetails(accountId);
        if (!accountDetails) {
          router.replace('/');
          return;
        }
        
        setAnggotaId(accountDetails.member.id);
        
        // Fetch jenis tabungan
        const jenisTabunganData = await TabunganService.getJenisTabungan();
        setJenisTabungan(jenisTabunganData);
      } catch (error) {
        console.error('Error fetching jenis tabungan:', error);
        Alert.alert('Error', 'Gagal memuat jenis tabungan');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [router]);
  
  // Handle jenis tabungan selection
  const handleSelectJenisTabungan = (jenis: JenisTabungan) => {
    if (!anggotaId) {
      Alert.alert('Error', 'Data anggota tidak ditemukan');
      return;
    }
    
    router.push({
      pathname: '/tabungan/open',
      params: { 
        jenisId: jenis.id,
        jenisKode: jenis.kode,
        jenisNama: jenis.nama,
        minimumSetoran: jenis.minimum_setoran.toString(),
        anggotaId: anggotaId
      }
    });
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
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Pilih Jenis Tabungan</Text>
        <Text style={styles.headerDescription}>
          Pilih jenis tabungan yang sesuai dengan kebutuhan Anda
        </Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Memuat jenis tabungan...</Text>
        </View>
      ) : (
        <JenisTabunganList
          jenisTabungan={jenisTabungan}
          onSelect={handleSelectJenisTabungan}
          isLoading={isLoading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
