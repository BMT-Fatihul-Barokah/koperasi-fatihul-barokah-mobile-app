import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { format } from 'date-fns';

interface TransactionItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

export default function DashboardScreen() {
  const { isLoading, isAuthenticated, member, balance, refreshUserData } = useAuth();
  
  // Loan balance is still mock data for now
  const loanBalance = 2000000;
  
  // Refresh user data when dashboard loads
  useEffect(() => {
    if (isAuthenticated) {
      refreshUserData();
    } else {
      // If not authenticated, redirect to login
      router.replace('/');
    }
  }, [isAuthenticated]);
  
  const recentTransactions: TransactionItem[] = [
    {
      id: 'tx1',
      date: '12 Apr 2025',
      description: 'Setoran Tunai',
      amount: 500000,
      type: 'credit'
    },
    {
      id: 'tx2',
      date: '10 Apr 2025',
      description: 'Penarikan Tunai',
      amount: 250000,
      type: 'debit'
    },
    {
      id: 'tx3',
      date: '05 Apr 2025',
      description: 'Angsuran Pembiayaan',
      amount: 350000,
      type: 'debit'
    },
    {
      id: 'tx4',
      date: '01 Apr 2025',
      description: 'Bagi Hasil',
      amount: 75000,
      type: 'credit'
    },
    {
      id: 'tx5',
      date: '28 Mar 2025',
      description: 'Setoran Tunai',
      amount: 1000000,
      type: 'credit'
    }
  ];

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
        <Text style={styles.greeting}>Assalamu'alaikum</Text>
        <Text style={styles.userName}>{member?.nama_lengkap || 'Anggota'}</Text>
        
        <View style={styles.lastUpdateContainer}>
          <Text style={styles.lastUpdateText}>
            Terakhir diperbarui: {currentDate}
          </Text>
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
          
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Saldo Pembiayaan</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(loanBalance)}</Text>
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
              <Text style={styles.quickActionText}>Transfer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionIconText}>📝</Text>
              </View>
              <Text style={styles.quickActionText}>Pembayaran</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionIconText}>📊</Text>
              </View>
              <Text style={styles.quickActionText}>Riwayat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionIconText}>🏦</Text>
              </View>
              <Text style={styles.quickActionText}>Pembiayaan</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
              </View>
              
              <Text 
                style={[
                  styles.transactionAmount,
                  transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount
                ]}
              >
                {transaction.type === 'credit' ? '+' : '-'} {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
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
          <Text style={[styles.navIcon, styles.activeNavIcon]}>🏠</Text>
          <Text style={[styles.navText, styles.activeNavText]}>Beranda</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>💼</Text>
          <Text style={styles.navText}>Rekening</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🔔</Text>
          <Text style={styles.navText}>Notifikasi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '48%',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
    color: '#999',
  },
  activeNavIcon: {
    color: '#007BFF',
  },
  navText: {
    fontSize: 12,
    color: '#999',
  },
  activeNavText: {
    color: '#007BFF',
  }
});
