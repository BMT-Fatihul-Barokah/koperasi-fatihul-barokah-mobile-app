import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TabunganWithJenis } from '../../lib/database.types';
import { TabunganService } from '../../services/tabungan.service';
import { formatCurrency, formatDate } from '../../lib/format-utils';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TransactionHistory } from '../../components/tabungan/transaction-history';

export default function TabunganDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [tabungan, setTabungan] = useState<TabunganWithJenis | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactionPage, setTransactionPage] = useState(0);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  
  // Get gradient colors based on jenis tabungan
  const getGradientColors = () => {
    if (!tabungan) return isDark ? ['#1a5fb4', '#3584e4'] : ['#3584e4', '#62a0ea'];
    
    switch (tabungan.jenis_tabungan.kode) {
      case 'SIBAROKAH':
        return isDark ? ['#1a5fb4', '#3584e4'] : ['#3584e4', '#62a0ea'];
      case 'SIMUROJA':
        return isDark ? ['#613583', '#9141ac'] : ['#9141ac', '#c061cb'];
      case 'SIDIKA':
        return isDark ? ['#a51d2d', '#e01b24'] : ['#e01b24', '#f66151'];
      case 'SIFITRI':
        return isDark ? ['#613583', '#865e3c'] : ['#986a44', '#cdab8f'];
      case 'SIQURBAN':
        return isDark ? ['#1c7c54', '#2ec27e'] : ['#26a269', '#57e389'];
      case 'SINIKA':
        return isDark ? ['#813d9c', '#c061cb'] : ['#c061cb', '#dc8add'];
      case 'SIUMROH':
        return isDark ? ['#1c7c54', '#26a269'] : ['#26a269', '#33d17a'];
      default:
        return isDark ? ['#1a5fb4', '#3584e4'] : ['#3584e4', '#62a0ea'];
    }
  };
  
  // Fetch tabungan details and transactions
  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch tabungan details
        const tabunganData = await TabunganService.getTabunganById(id);
        if (!tabunganData) {
          Alert.alert('Error', 'Tabungan tidak ditemukan');
          router.back();
          return;
        }
        
        setTabungan(tabunganData);
        
        // Fetch initial transactions
        await fetchTransactions(0);
      } catch (error) {
        console.error('Error fetching tabungan details:', error);
        Alert.alert('Error', 'Gagal memuat data tabungan');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [id, router]);
  
  // Fetch transactions with pagination
  const fetchTransactions = async (page: number) => {
    if (!id) return;
    
    const limit = 10;
    const offset = page * limit;
    
    try {
      setIsTransactionsLoading(true);
      
      const transactionData = await TabunganService.getRiwayatTransaksi(id, limit, offset);
      
      if (page === 0) {
        setTransactions(transactionData);
      } else {
        setTransactions(prev => [...prev, ...transactionData]);
      }
      
      // Check if there are more transactions to load
      setHasMoreTransactions(transactionData.length === limit);
      setTransactionPage(page);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsTransactionsLoading(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      if (id) {
        // Refresh tabungan details
        const tabunganData = await TabunganService.getTabunganById(id);
        if (tabunganData) {
          setTabungan(tabunganData);
        }
        
        // Refresh transactions
        await fetchTransactions(0);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle loading more transactions
  const handleLoadMoreTransactions = () => {
    if (hasMoreTransactions && !isTransactionsLoading) {
      fetchTransactions(transactionPage + 1);
    }
  };
  
  // Handle deposit button press
  const handleDeposit = () => {
    if (tabungan) {
      router.push({
        pathname: '/tabungan/transaction',
        params: { id: tabungan.id, type: 'deposit' }
      });
    }
  };
  
  // Handle withdrawal button press
  const handleWithdrawal = () => {
    if (tabungan) {
      router.push({
        pathname: '/tabungan/transaction',
        params: { id: tabungan.id, type: 'withdrawal' }
      });
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Memuat data tabungan...</Text>
      </SafeAreaView>
    );
  }
  
  if (!tabungan) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Text style={styles.errorText}>Tabungan tidak ditemukan</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerTintColor: 'white',
          headerBackTitle: 'Kembali',
        }}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={getGradientColors()}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.accountType}>{tabungan.jenis_tabungan.nama}</Text>
            <Text style={styles.accountNumber}>{tabungan.nomor_rekening}</Text>
            <Text style={styles.balanceLabel}>Saldo</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(tabungan.saldo)}</Text>
          </View>
        </LinearGradient>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDeposit}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#2ec27e' }]}>
              <Ionicons name="arrow-down" size={24} color="white" />
            </View>
            <Text style={styles.actionText}>Setor</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleWithdrawal}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#e01b24' }]}>
              <Ionicons name="arrow-up" size={24} color="white" />
            </View>
            <Text style={styles.actionText}>Tarik</Text>
          </TouchableOpacity>
        </View>
        
        {/* Account Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Informasi Rekening</Text>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Jenis Tabungan</Text>
            <Text style={styles.detailValue}>{tabungan.jenis_tabungan.nama}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Nomor Rekening</Text>
            <Text style={styles.detailValue}>{tabungan.nomor_rekening}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tanggal Pembukaan</Text>
            <Text style={styles.detailValue}>{formatDate(tabungan.tanggal_buka)}</Text>
          </View>
          
          {tabungan.tanggal_jatuh_tempo && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Jatuh Tempo</Text>
              <Text style={styles.detailValue}>{formatDate(tabungan.tanggal_jatuh_tempo)}</Text>
            </View>
          )}
          
          {tabungan.jenis_tabungan.bagi_hasil && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Bagi Hasil</Text>
              <Text style={styles.detailValue}>{tabungan.jenis_tabungan.bagi_hasil}%</Text>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <View 
                style={[
                  styles.statusIndicator, 
                  { backgroundColor: tabungan.status === 'aktif' ? '#2ec27e' : '#e01b24' }
                ]} 
              />
              <Text style={styles.statusText}>
                {tabungan.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <Text style={styles.transactionTitle}>Riwayat Transaksi</Text>
          
          <TransactionHistory
            transactions={transactions}
            isLoading={isTransactionsLoading}
            onEndReached={handleLoadMoreTransactions}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingTop: 100,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  accountType: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  accountNumber: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 16,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 36,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -30,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '45%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionSection: {
    marginHorizontal: 16,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
