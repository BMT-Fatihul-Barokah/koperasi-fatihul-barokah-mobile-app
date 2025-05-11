import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  useWindowDimensions,
  Image 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { useData } from '../../context/data-context';
import { format, parseISO } from 'date-fns';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TabunganWithJenis } from '../../lib/database.types';
import { TabunganService } from '../../services/tabungan.service';
import { TabunganCarousel } from '../../components/tabungan/tabungan-carousel';
import { formatCurrency as formatCurrencyUtil } from '../../lib/format-utils';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  
  // Create styles with dynamic values based on theme and dimensions
  const styles = useMemo(() => createStyles(isDark, width), [isDark, width]);
  
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
        
        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/tabungan/history')}
            >
              <Text style={styles.viewAllText}>Lihat Semua</Text>
              <Ionicons name="chevron-forward" size={16} color={isDark ? "#FFFFFF" : "#007BFF"} />
            </TouchableOpacity>
          </View>
          
          {transactions.data.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <MaterialCommunityIcons name="cash" size={48} color={isDark ? "#555" : "#CCC"} />
              <Text style={styles.emptyTransactionsText}>Belum ada transaksi</Text>
            </View>
          ) : (
            transactions.data.slice(0, 5).map((transaction, index) => (
              <TouchableOpacity 
                key={transaction.id} 
                style={styles.transactionItem}
                onPress={() => router.push(`/tabungan/transaction/${transaction.id}`)}
              >
                <View style={styles.transactionIconContainer}>
                  <MaterialCommunityIcons 
                    name={transaction.jenis === 'deposit' ? 'cash-plus' : 
                          transaction.jenis === 'withdraw' ? 'cash-minus' : 'bank-transfer'} 
                    size={24} 
                    color={transaction.jenis === 'deposit' ? '#4CAF50' : 
                           transaction.jenis === 'withdraw' ? '#F44336' : '#2196F3'} 
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>
                    {transaction.jenis === 'deposit' ? 'Setoran' : 
                     transaction.jenis === 'withdraw' ? 'Penarikan' : 'Transfer'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatTransactionDate(transaction.created_at)}
                  </Text>
                </View>
                <Text style={[styles.transactionAmount, 
                  {color: transaction.jenis === 'deposit' ? '#4CAF50' : '#F44336'}]}>
                  {transaction.jenis === 'deposit' ? '+ ' : '- '}
                  {formatCurrency(transaction.jumlah)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
        
        {/* Announcements */}
        <View style={styles.announcementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pengumuman</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Lihat Semua</Text>
              <Ionicons name="chevron-forward" size={16} color={isDark ? "#FFFFFF" : "#007BFF"} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient
              colors={isDark ? ['#1A237E', '#303F9F'] : ['#1A237E', '#303F9F']}
              style={styles.announcementCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.announcementIconContainer}>
                <MaterialCommunityIcons name="calendar-alert" size={24} color="white" />
              </View>
              <View style={styles.announcementContent}>
                <Text style={styles.announcementTitle}>Kantor Tutup untuk Idul Fitri</Text>
                <Text style={styles.announcementDate}>10 Apr 2025</Text>
                <Text style={styles.announcementText}>
                  Kantor kami akan tutup dari tanggal 15-18 April 2025 untuk Idul Fitri. Operasional normal akan dilanjutkan pada tanggal 19 April 2025.
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient
              colors={isDark ? ['#880E4F', '#C2185B'] : ['#880E4F', '#C2185B']}
              style={styles.announcementCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.announcementIconContainer}>
                <MaterialCommunityIcons name="cash-multiple" size={24} color="white" />
              </View>
              <View style={styles.announcementContent}>
                <Text style={styles.announcementTitle}>Program Pembiayaan Baru</Text>
                <Text style={styles.announcementDate}>05 Apr 2025</Text>
                <Text style={styles.announcementText}>
                  Kami meluncurkan program pembiayaan usaha mikro baru dengan margin kompetitif. Kunjungi kantor kami untuk informasi lebih lanjut.
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
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

// Create styles with dynamic values based on theme and dimensions
const createStyles = (isDark: boolean, width: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#F5F7FA',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
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
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  memberNumber: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  profileButton: {
    marginLeft: 16,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselSection: {
    marginTop: -20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#FFFFFF' : '#333333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 123, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  viewAllText: {
    color: isDark ? '#FFFFFF' : '#007BFF',
    marginRight: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  quickActionsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
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
  quickActionGradient: {
    borderRadius: 12,
    padding: 16,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  transactionsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: isDark ? '#FFFFFF' : '#333333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#999999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyTransactionsText: {
    marginTop: 12,
    fontSize: 16,
    color: isDark ? '#999' : '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: isDark ? '#CCCCCC' : '#666666',
  },
  announcementsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  announcementCard: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    padding: 16,
  },
  announcementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  announcementDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  announcementText: {
    fontSize: 14,
    color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'white',
    lineHeight: 20,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: isDark ? '#1E1E1E' : '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#333' : '#eee',
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
