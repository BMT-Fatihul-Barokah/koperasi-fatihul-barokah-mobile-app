import React, { useEffect, useState, useMemo } from 'react';
import { Logger } from '../../lib/logger';
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
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TabunganCarousel } from '../../components/tabungan/tabungan-carousel';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';
import { formatCurrency as formatCurrencyUtil } from '../../lib/format-utils';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NOTIFICATION_TYPES } from '../../services/notification.service';
import { useTransactions } from '../../hooks/useTransactions';
import { useNotifications } from '../../hooks/useNotifications';
import { useTabungan } from '../../hooks/useTabungan';

export default function DashboardScreen() {
  const { isLoading: authLoading, isAuthenticated, member, balance, refreshUserData } = useAuth();
  const { transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useTransactions();
  const { notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useNotifications();
  const { tabunganList, isLoading: tabunganLoading, refetch: refetchTabungan } = useTabungan();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtered announcements from notifications
  const announcements = useMemo(() => {
    return notifications
      .filter(notification => notification.jenis === 'pengumuman')
      .slice(0, 3); // Limit to 3 announcements for the dashboard
  }, [notifications]);
  
  // Create styles with dynamic values based on theme and dimensions
  const styles = useMemo(() => createStyles(isDark, width), [isDark, width]);
  
  // Loan balance is still mock data for now
  const loanBalance = 2000000;
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      Logger.info('Dashboard', 'User is not authenticated, redirecting to login');
      // Use setTimeout to ensure the Root Layout is mounted before navigation
      // This helps prevent the "Attempted to navigate before mounting the Root Layout component" error in web
      const timer = setTimeout(() => {
        router.replace('/');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);
  
  // Log member data for debugging in development only
  useEffect(() => {
    if (member) {
      Logger.debug('Dashboard', 'Member data loaded', {
        id: member.id,
        nama: member.nama,
        nomor_rekening: member.nomor_rekening
      });
      Logger.debug('Dashboard', 'Balance loaded', { balance });
    }
  }, [member, balance]);
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    Logger.info('Dashboard', 'Manual refresh triggered');
    
    // Refresh all data in parallel
    await Promise.all([
      refreshUserData(),
      refetchTransactions(),
      refetchNotifications(),
      refetchTabungan()
    ]);
    
    setRefreshing(false);
  };
  
  // Handle view all tabungan press
  const handleViewAllTabungan = () => {
    router.push('/tabungan');
  };
  
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
    Logger.info('Dashboard', 'Manual refresh triggered');
    handleRefresh();
  };
  
  // Get appropriate icon based on announcement title or content
  const getAnnouncementIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    
    // Calendar/schedule related announcements
    if (lowerTitle.includes('tutup') || 
        lowerTitle.includes('buka') || 
        lowerTitle.includes('jadwal') || 
        lowerTitle.includes('libur') ||
        lowerTitle.includes('idul') ||
        lowerTitle.includes('ramadan')) {
      return 'calendar-alert';
    }
    
    // Money/finance related announcements
    if (lowerTitle.includes('pembiayaan') || 
        lowerTitle.includes('margin') || 
        lowerTitle.includes('pinjaman') || 
        lowerTitle.includes('tabungan') ||
        lowerTitle.includes('biaya') ||
        lowerTitle.includes('cicilan')) {
      return 'cash-multiple';
    }
    
    // Meeting/gathering related announcements
    if (lowerTitle.includes('rapat') || 
        lowerTitle.includes('pertemuan') || 
        lowerTitle.includes('anggota') ||
        lowerTitle.includes('acara')) {
      return 'account-group';
    }
    
    // System/app related announcements
    if (lowerTitle.includes('sistem') || 
        lowerTitle.includes('aplikasi') || 
        lowerTitle.includes('update') ||
        lowerTitle.includes('pembaruan') ||
        lowerTitle.includes('versi')) {
      return 'cellphone-cog';
    }
    
    // Default to megaphone for general announcements
    return 'bullhorn';
  };

  if (authLoading) {
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
          {tabunganLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066CC" />
              <Text style={styles.loadingText}>Memuat data tabungan...</Text>
            </View>
          ) : tabunganList.length > 0 ? (
            <TabunganCarousel 
              tabunganList={tabunganList}
              onViewAllPress={handleViewAllTabungan}
            />
          ) : (
            <View style={styles.emptyTransactions}>
              <MaterialCommunityIcons name="piggy-bank" size={48} color={isDark ? "#555" : "#CCC"} />
              <Text style={styles.emptyTransactionsText}>
                Belum ada tabungan
              </Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/tabungan/new')}
              >
                <Text style={styles.viewAllText}>+ Buka Tabungan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/activity')}>
              <Text style={styles.viewAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          {transactionsLoading ? (
            <ActivityIndicator size="small" color="#007BFF" style={{ marginVertical: 20 }} />
          ) : transactions.length > 0 ? (
            <View>
              {transactions.slice(0, 3).map((transaction) => (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={styles.transactionItem}
                  onPress={() => router.push(`/activity/${transaction.id}`)}
                >
                  <View style={[styles.transactionIconContainer, {
                    backgroundColor: transaction.tipe_transaksi === 'masuk' ? '#4CAF50' : '#F44336'
                  }]}>
                    <MaterialCommunityIcons 
                      name={transaction.tipe_transaksi === 'masuk' ? 'arrow-down' : 'arrow-up'} 
                      size={20} 
                      color="white" 
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle} numberOfLines={1}>
                      {transaction.deskripsi || transaction.kategori}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatTransactionDate(transaction.created_at)}
                    </Text>
                  </View>
                  <Text 
                    style={[styles.transactionAmount, {
                      color: transaction.tipe_transaksi === 'masuk' ? '#4CAF50' : '#F44336'
                    }]}
                  >
                    {transaction.tipe_transaksi === 'masuk' ? '+' : '-'} {formatCurrency(transaction.jumlah)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTransactions}>
              <MaterialCommunityIcons name="cash" size={48} color={isDark ? "#555" : "#CCC"} />
              <Text style={styles.emptyTransactionsText}>
                Belum ada transaksi
              </Text>
            </View>
          )}
        </View>
        
        {/* Announcements */}
        <View style={styles.announcementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pengumuman</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/notifications')}
            >
              <Text style={styles.viewAllText}>Lihat Semua</Text>
              <Ionicons name="chevron-forward" size={16} color={isDark ? "#FFFFFF" : "#007BFF"} />
            </TouchableOpacity>
          </View>
          
          {notificationsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007BFF" />
              <Text style={styles.loadingText}>Memuat pengumuman...</Text>
            </View>
          ) : announcements.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <MaterialCommunityIcons name="bell-outline" size={48} color={isDark ? "#555" : "#CCC"} />
              <Text style={styles.emptyTransactionsText}>Belum ada pengumuman</Text>
            </View>
          ) : (
            announcements.map((announcement, index) => {
              // Get gradient colors based on index to make each card visually distinct
              const gradientPalettes = [
                ['#1A237E', '#303F9F'], // Blue
                ['#880E4F', '#C2185B'], // Pink
                ['#004D40', '#00796B'], // Green
                ['#BF360C', '#E64A19'], // Orange
              ];
              const gradientColors = gradientPalettes[index % 4] as [string, string];
              
              // Format the date
              const formattedDate = format(parseISO(announcement.created_at), 'dd MMM yyyy', { locale: idLocale });
              
              // Get the time ago (e.g., "2 days ago")
              const timeAgo = formatDistanceToNow(parseISO(announcement.created_at), { 
                addSuffix: true,
                locale: idLocale 
              });
              
              return (
                <TouchableOpacity 
                  key={announcement.id} 
                  activeOpacity={0.9}
                  onPress={() => router.push(`/notifications/${announcement.id}`)}
                >
                  <LinearGradient
                    colors={gradientColors}
                    style={styles.announcementCard}
                    start={[0, 0]}
                    end={[1, 1]}
                  >
                    <View style={styles.announcementIconContainer}>
                      <MaterialCommunityIcons 
                        name={getAnnouncementIcon(announcement.judul) as any} 
                        size={24} 
                        color="white" 
                      />
                    </View>
                    <View style={styles.announcementContent}>
                      <Text style={styles.announcementTitle}>{announcement.judul}</Text>
                      <Text style={styles.announcementDate}>{formattedDate} • {timeAgo}</Text>
                      <Text style={styles.announcementText} numberOfLines={3}>
                        {announcement.pesan}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
      
      {/* Navbar */}
      <BottomNavBar />
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
