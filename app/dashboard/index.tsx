import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { useData } from '../../context/data-context';
import { format, parseISO } from 'date-fns';
// Removed direct supabase import as we're using the data context now
import { Ionicons } from '@expo/vector-icons';
import { TabunganWithJenis } from '../../lib/database.types';
import { TabunganService } from '../../services/tabungan.service';
import { TabunganCarousel } from '../../components/tabungan/tabungan-carousel';
import { formatCurrency } from '../../lib/format-utils';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Transaction interface is now imported from data-context

export default function DashboardScreen() {
  const { isLoading, isAuthenticated, member, balance, refreshUserData } = useAuth();
  const { transactions, fetchTransactions } = useData();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // State for tabungan data
  const [tabunganList, setTabunganList] = useState<TabunganWithJenis[]>([]);
  const [isTabunganLoading, setIsTabunganLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Loan balance is still mock data for now
  const loanBalance = 2000000;
  
  // Refresh user data when dashboard loads
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Dashboard: User is authenticated, refreshing user data');
      refreshUserData();
    } else {
      console.log('Dashboard: User is not authenticated, redirecting to login');
      // Use setTimeout to ensure the Root Layout is mounted before navigation
      // This helps prevent the "Attempted to navigate before mounting the Root Layout component" error in web
      const timer = setTimeout(() => {
        router.replace('/');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]); // Remove refreshUserData from dependencies
  
  // Fetch tabungan data when member changes
  useEffect(() => {
    if (member?.id) {
      fetchTabunganData(member.id);
    }
  }, [member?.id]);
  
  // Fetch tabungan data
  const fetchTabunganData = async (anggotaId: string) => {
    try {
      setIsTabunganLoading(true);
      const tabunganData = await TabunganService.getTabunganByAnggota(anggotaId);
      setTabunganList(tabunganData);
    } catch (error) {
      console.error('Error fetching tabungan data:', error);
    } finally {
      setIsTabunganLoading(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    refreshUserData();
    fetchTransactions();
    
    if (member?.id) {
      await fetchTabunganData(member.id);
    }
    
    setRefreshing(false);
  };
  
  // Handle view all tabungan press
  const handleViewAllTabungan = () => {
    router.push('/tabungan');
  };
  
  // Log member data for debugging
  useEffect(() => {
    if (member) {
      console.log('Dashboard: Member data loaded:', {
        id: member.id,
        nama: member.nama,
        saldo: member.saldo,
        nomor_rekening: member.nomor_rekening
      });
      console.log('Dashboard: Balance:', balance);
    }
  }, [member, balance]);
  
  // Fetch recent transactions when dashboard loads
  useEffect(() => {
    if (isAuthenticated && member) {
      console.log('Dashboard: Fetching transactions');
      fetchTransactions();
    }
  }, [isAuthenticated, member, fetchTransactions]);
  
  // Format date for display
  const formatTransactionDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'd MMM yyyy');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format current date for last updated
  const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm');
  
  // Handle refresh action
  const handleRefreshAction = () => {
    console.log('Dashboard: Manual refresh triggered');
    refreshUserData();
    fetchTransactions(true); // Force refresh
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#003D82', '#0066CC']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Selamat datang,</Text>
              <Text style={styles.userName}>{member?.nama || 'Anggota'}</Text>
              <Text style={styles.memberNumber}>No. Anggota: {member?.nomor_rekening || '-'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => router.push('/dashboard/settings')}
            >
              <View style={styles.profileIconContainer}>
                <Ionicons name="settings-outline" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        {/* Main Account Card */}
        <View style={styles.mainAccountCard}>
          <View style={styles.accountHeader}>
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Saldo Aktif</Text>
              <Text style={styles.accountNumber}>{member?.nomor_rekening || '-'}</Text>
            </View>
            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy-outline" size={20} color="#0066CC" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceAmount}>
              {balance !== null ? 
                formatCurrency(balance) : 
                'Rp -'}
            </Text>
            <TouchableOpacity style={styles.eyeButton}>
              <Ionicons name="eye-outline" size={24} color="#0066CC" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.transactionsButton}
            onPress={() => router.push('/tabungan')}
          >
            <Text style={styles.transactionsText}>Riwayat Transaksi</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tabungan Carousel Section */}
        <View style={styles.carouselSection}>
          {isTabunganLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066CC" />
              <Text style={styles.loadingText}>Memuat data tabungan...</Text>
            </View>
          ) : (
            <TabunganCarousel 
              tabunganList={tabunganList}
              onViewAllPress={handleViewAllTabungan}
            />
          )}
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionItem}>
              <Image 
                source={require('../../assets/informasi-deposit.png')} 
                style={styles.quickActionImage} 
                resizeMode="contain"
              />
              <Text style={styles.quickActionText}>Informasi Deposit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <Image 
                source={require('../../assets/informasi-pinjaman.png')} 
                style={styles.quickActionImage} 
                resizeMode="contain"
              />
              <Text style={styles.quickActionText}>Informasi Pinjaman</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <Image 
                source={require('../../assets/pengajuan-pinjaman.png')} 
                style={styles.quickActionImage} 
                resizeMode="contain"
              />
              <Text style={styles.quickActionText}>Detail Tabungan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <Image 
                source={require('../../assets/informasi-penarikan-saldo.png')} 
                style={styles.quickActionImage} 
                resizeMode="contain"
              />
              <Text style={styles.quickActionText}>Informasi Penarikan Saldo</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/activity')}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          {transactions.isLoading ? (
            <View style={styles.loadingTransactions}>
              <ActivityIndicator size="small" color="#007BFF" />
              <Text style={styles.loadingText}>Memuat transaksi...</Text>
            </View>
          ) : transactions.data.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyTransactionsText}>Belum ada transaksi</Text>
            </View>
          ) : (
            <View>
              {transactions.data.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDate}>{formatTransactionDate(transaction.created_at)}</Text>
                    <Text style={styles.transactionDescription}>{transaction.deskripsi}</Text>
                  </View>
                  
                  <Text 
                    style={[
                      styles.transactionAmount,
                      transaction.tipe_transaksi === 'masuk' ? styles.creditAmount : styles.debitAmount
                    ]}
                  >
                    {transaction.tipe_transaksi === 'masuk' ? '+' : '-'} {formatCurrency(transaction.jumlah)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Announcements */}
        <View style={styles.announcementsSection}>
          <Text style={styles.sectionTitle}>Pengumuman</Text>
          
          <View style={styles.announcementCard}>
            <Text style={styles.announcementTitle}>Kantor Tutup untuk Idul Fitri</Text>
            <Text style={styles.announcementDate}>10 Apr 2025</Text>
            <Text style={styles.announcementContent}>
              Kantor kami akan tutup dari tanggal 15-18 April 2025 untuk Idul Fitri. Operasional normal akan dilanjutkan pada tanggal 19 April 2025.
            </Text>
          </View>
          
          <View style={styles.announcementCard}>
            <Text style={styles.announcementTitle}>Program Pembiayaan Baru</Text>
            <Text style={styles.announcementDate}>05 Apr 2025</Text>
            <Text style={styles.announcementContent}>
              Kami meluncurkan program pembiayaan usaha mikro baru dengan margin kompetitif. Kunjungi kantor kami untuk informasi lebih lanjut.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem}>
          <Image 
            source={require('../../assets/Beranda.png')} 
            style={[styles.navIcon, styles.activeNavIcon]} 
            resizeMode="contain"
          />
          <Text style={[styles.navText, styles.activeNavText]}>Beranda</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/activity')}
        >
          <Image 
            source={require('../../assets/aktifitas.png')} 
            style={styles.navIcon} 
            resizeMode="contain"
            tintColor="#999"
          />
          <Text style={styles.navText}>Aktifitas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/dashboard/notifications')}
        >
          <Image 
            source={require('../../assets/notifikasi.png')} 
            style={styles.navIcon} 
            resizeMode="contain"
            tintColor="#999"
          />
          <Text style={styles.navText}>Notifikasi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/dashboard/profile')}
        >
          <Image 
            source={require('../../assets/profil.png')} 
            style={styles.navIcon} 
            resizeMode="contain"
            tintColor="#999"
          />
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 4,
  },
  memberNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileButton: {
    padding: 8,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainAccountCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 16,
    color: '#333',
  },
  copyButton: {
    padding: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  eyeButton: {
    padding: 4,
  },
  transactionsButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  transactionsText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  carouselSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  emptyTabunganContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTabunganText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  openTabunganButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  openTabunganButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#666',
  },
  quickActionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 15,
  },
  quickActionImage: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  transactionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007BFF',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#333',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  creditAmount: {
    color: '#28a745',
  },
  debitAmount: {
    color: '#dc3545',
  },
  loadingTransactions: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTransactions: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  announcementsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  announcementContent: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 36,
    height: 36,
    marginBottom: 6,
  },
  activeNavIcon: {
    tintColor: '#007BFF',
  },
  navText: {
    fontSize: 14,
    color: '#999',
  },
  activeNavText: {
    color: '#007BFF',
  }
});
