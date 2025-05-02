import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
  id: string;
  anggota_id: string;
  tipe_transaksi: 'masuk' | 'keluar';
  kategori: string;
  deskripsi: string;
  reference_number?: string;
  jumlah: number;
  created_at: string;
  recipient_name?: string;
  bank_name?: string;
}

export default function DashboardScreen() {
  const { isLoading, isAuthenticated, member, balance, refreshUserData } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
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
  }, [isAuthenticated]);
  
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
  
  // Fetch recent transactions
  useEffect(() => {
    if (!isAuthenticated || !member) return;
    
    const fetchRecentTransactions = async () => {
      setIsLoadingTransactions(true);
      try {
        const { data, error } = await supabase
          .from('transaksi')
          .select('*')
          .eq('anggota_id', member.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching recent transactions:', error);
          return;
        }

        // Add recipient data for transfer transactions
        const transactionsWithRecipients = data.map(tx => {
          let recipientName, bankName;
          
          if (tx.kategori === 'transfer') {
            if (tx.deskripsi?.includes('BLU')) {
              recipientName = 'NOVANDRA ANUGRAH';
              bankName = 'BLU BY BCA DIGITAL';
            } else if (tx.deskripsi?.includes('SHOPEE')) {
              recipientName = 'SHOPEE - nXXXXXXXX9';
              bankName = 'BCA Virtual Account';
            } else if (tx.deskripsi?.includes('OVO')) {
              recipientName = 'NOVANDRA ANUGRAH';
              bankName = 'OVO';
            }
          }
          
          return {
            ...tx,
            recipient_name: recipientName,
            bank_name: bankName
          };
        });
        
        setTransactions(transactionsWithRecipients);
      } catch (error) {
        console.error('Error in transaction fetch:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchRecentTransactions();
  }, [isAuthenticated, member]);
  
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
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Assalamu'alaikum</Text>
            <Text style={styles.userName}>{member?.nama || 'Anggota'}</Text>
            
            <View style={styles.lastUpdateContainer}>
              <Text style={styles.lastUpdateText}>
                Terakhir diperbarui: {currentDate}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/dashboard/profile')}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {member?.nama ? member.nama.charAt(0).toUpperCase() : 'A'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Saldo Tabungan</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(balance || 0)}</Text>
            <TouchableOpacity style={styles.viewDetailsButton}>
              <Text style={styles.viewDetailsText}>Lihat Detail</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionIconText}>💰</Text>
              </View>
              <Text style={styles.quickActionText}>Informasi Deposit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionIconText}>📝</Text>
              </View>
              <Text style={styles.quickActionText}>Informasi Pinjaman</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionIconText}>📊</Text>
              </View>
              <Text style={styles.quickActionText}>Pengajuan Pinjaman</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionIconText}>🏦</Text>
              </View>
              <Text style={styles.quickActionText}>Informasi Penarikan Saldo</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/activity')}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          {isLoadingTransactions ? (
            <View style={styles.loadingTransactions}>
              <ActivityIndicator size="small" color="#007BFF" />
              <Text style={styles.loadingText}>Memuat transaksi...</Text>
            </View>
          ) : transactions.length > 0 ? (
            transactions.map((transaction) => (
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
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyTransactionsText}>Belum ada transaksi</Text>
            </View>
          )}
        </View>
        
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
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007BFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    padding: 5,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  lastUpdateContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#007BFF',
  },
  viewDetailsButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
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
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIconText: {
    fontSize: 20,
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
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
    paddingVertical: 16,
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
