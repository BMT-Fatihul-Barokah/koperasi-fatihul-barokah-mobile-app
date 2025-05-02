import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { TransactionCard } from '../../components/transaction/TransactionCard';
import { ActivityHeader } from '../../components/header/ActivityHeader';

// Define transaction interface based on the database schema
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

// Tab type for filtering transactions
type TabType = 'transaction' | 'others';

export default function ActivityScreen() {
  const { isLoading: authLoading, isAuthenticated, member } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('transaction');
  const [currentMonth, setCurrentMonth] = useState<string>(format(new Date(), 'MMMM'));

  // Fetch transactions from Supabase
  useEffect(() => {
    if (!isAuthenticated || !member) {
      // Redirect to login if not authenticated
      router.replace('/');
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('transaksi')
          .select('*')
          .eq('anggota_id', member.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching transactions:', error);
          return;
        }

        // Add mock recipient data for demo purposes
        // In a real app, this would come from the database
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
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [isAuthenticated, member]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Group transactions by month
  const groupTransactionsByMonth = () => {
    const grouped: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = parseISO(transaction.created_at);
      const month = format(date, 'MMMM');
      
      if (!grouped[month]) {
        grouped[month] = [];
      }
      
      grouped[month].push(transaction);
    });
    
    return grouped;
  };

  const groupedTransactions = groupTransactionsByMonth();

  // Format date for display
  const formatTransactionDate = (dateString: string) => {
    const date = parseISO(dateString);
    return {
      day: format(date, 'd'),
      month: format(date, 'MMM'),
      year: format(date, 'yyyy')
    };
  };

  // Render transaction item using the reusable component
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TransactionCard
      id={item.id}
      date={item.created_at}
      description={item.deskripsi}
      amount={Number(item.jumlah)}
      type={item.tipe_transaksi}
      category={item.kategori}
      recipientName={item.recipient_name}
      bankName={item.bank_name}
      onPress={() => router.push(`/activity/${item.id}`)}
    />
  );

  // Render month section
  const renderMonthSection = (month: string, monthTransactions: Transaction[]) => (
    <View key={month} style={styles.monthSection}>
      <Text style={styles.monthTitle}>{month}</Text>
      {monthTransactions.map(transaction => (
        <View key={transaction.id}>
          {renderTransactionItem({ item: transaction })}
        </View>
      ))}
    </View>
  );

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Memuat data aktivitas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ActivityHeader 
        title="Activity"
        showFilterButton
        onFilterPress={() => console.log('Filter pressed')}
      />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'transaction' && styles.activeTabButton]}
          onPress={() => setActiveTab('transaction')}
        >
          <Text style={[styles.tabText, activeTab === 'transaction' && styles.activeTabText]}>
            Transaction
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'others' && styles.activeTabButton]}
          onPress={() => setActiveTab('others')}
        >
          <Text style={[styles.tabText, activeTab === 'others' && styles.activeTabText]}>
            Others
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'transaction' ? (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={styles.transactionsContainer}>
              {Object.keys(groupedTransactions).map(month => 
                renderMonthSection(month, groupedTransactions[month])
              )}
              
              {transactions.length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>Tidak ada transaksi</Text>
                </View>
              )}
            </View>
          }
          style={styles.flatList}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Tidak ada data lainnya</Text>
        </View>
      )}
      
      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/dashboard')}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>Beranda</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.activeNavIcon]}>💼</Text>
          <Text style={[styles.navText, styles.activeNavText]}>Aktifitas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/dashboard/notifications')}
        >
          <Text style={styles.navIcon}>🔔</Text>
          <Text style={styles.navText}>Notifikasi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/dashboard/profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginRight: 20,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007BFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  flatList: {
    flex: 1,
  },
  transactionsContainer: {
    padding: 15,
  },
  monthSection: {
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
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
