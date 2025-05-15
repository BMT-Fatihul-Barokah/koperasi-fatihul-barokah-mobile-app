import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, SectionList } from 'react-native';
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
import { BackHeader } from '../../components/header/back-header';

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
  const getGradientColors = (): [string, string] => {
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
  
  // No deposit or withdrawal functionality as per requirements
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Memuat data tabungan...</Text>
      </SafeAreaView>
    );
  }
  
  if (!tabungan) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <BackHeader title="Error" />
        <View style={styles.errorContentContainer}>
          <Text style={styles.errorText}>Tabungan tidak ditemukan</Text>
          <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <BackHeader title="Detail Tabungan" />
      
      <SectionList
        sections={[
          {
            title: 'account-info',
            data: [null],
            renderItem: () => (
              <View>
                {/* Header Section */}
                <LinearGradient
                  colors={getGradientColors()}
                  style={styles.header}
                  start={[0, 0]}
                  end={[1, 1]}
                >
                  <View style={styles.headerContent}>
                    <Text style={styles.accountType}>{tabungan.jenis_tabungan.nama}</Text>
                    <Text style={styles.accountNumber}>{tabungan.nomor_rekening}</Text>
                    <Text style={styles.balanceLabel}>Saldo</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(tabungan.saldo)}</Text>
                  </View>
                </LinearGradient>
                
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryItem}>
                    <Ionicons name="calendar-outline" size={22} color="#007BFF" style={styles.summaryIcon} />
                    <View>
                      <Text style={styles.summaryLabel}>Tanggal Pembukaan</Text>
                      <Text style={styles.summaryValue}>{formatDate(tabungan.tanggal_buka)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.summaryItem}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#007BFF" style={styles.summaryIcon} />
                    <View>
                      <Text style={styles.summaryLabel}>Status</Text>
                      <Text style={[styles.summaryValue, { color: tabungan.status === 'aktif' ? '#2ec27e' : '#e01b24' }]}>
                        {tabungan.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </Text>
                    </View>
                  </View>
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
                
                {/* Transaction History Title */}
                <View style={styles.transactionSection}>
                  <Text style={styles.transactionTitle}>Riwayat Transaksi</Text>
                </View>
              </View>
            ),
          },
          {
            title: 'transactions',
            data: [null],
            renderItem: () => (
              <TransactionHistory
                transactions={transactions}
                isLoading={isTransactionsLoading}
                onEndReached={handleLoadMoreTransactions}
              />
            ),
          },
        ]}
        keyExtractor={(item, index) => index.toString()}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={() => null}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
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
    backgroundColor: '#F8F9FA',
  },
  errorContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  errorBackButton: {
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
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: -30,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: '#EEEEEE',
    marginHorizontal: 12,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
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
    color: '#333',
  },
});
