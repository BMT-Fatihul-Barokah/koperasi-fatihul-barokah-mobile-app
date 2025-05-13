import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { TransactionCard } from '../../components/transaction/TransactionCard';
import { DashboardHeader } from '../../components/header/dashboard-header';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

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
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Create styles with dynamic values based on theme and dimensions
  const styles = useMemo(() => createStyles(isDark, width), [isDark, width]);

  // Fetch transactions from Supabase
  useEffect(() => {
    if (!isAuthenticated || !member) {
      // Redirect to login if not authenticated
      router.replace('/');
      return;
    }

    fetchTransactions();
  }, [isAuthenticated, member]);
  
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Log member info for debugging
      console.log('Current member info:', { 
        memberId: member?.id,
        memberName: member?.nama,
        isAuthenticated
      });
      
      if (!member?.id) {
        console.warn('Member ID is undefined, cannot fetch transactions');
        setIsLoading(false);
        return;
      }
      
      // Directly fetch transactions for this member
      const { data, error } = await supabase
        .from('transaksi')
        .select('*')
        .eq('anggota_id', member.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching transactions:', error);
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${data?.length || 0} transactions for member ID: ${member.id}`);
      
      // If no transactions found, try fetching a sample for debugging
      if (!data || data.length === 0) {
        console.log('No transactions found for this member, fetching sample for debugging...');
        const { data: sampleData, error: sampleError } = await supabase
          .from('transaksi')
          .select('id, anggota_id, tipe_transaksi, kategori, jumlah')
          .limit(5);
          
        if (!sampleError && sampleData && sampleData.length > 0) {
          console.log('Sample transactions:', sampleData);
        } else if (sampleError) {
          console.error('Error fetching sample transactions:', sampleError);
        }
      }

      // Add mock recipient data for demo purposes
      // In a real app, this would come from the database
      const transactionsWithRecipients = (data || []).map(tx => {
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
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
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

  // Render transaction item using the reusable component
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TransactionCard
      id={item.id}
      date={item.created_at}
      description={item.deskripsi || ''}
      amount={Number(item.jumlah)}
      type={item.tipe_transaksi}
      category={item.kategori}
      recipientName={item.recipient_name}
      bankName={item.bank_name}
      onPress={() => router.push(`/activity/${item.id}`)}
    />
  );
  
  // Render empty state when no transactions are available
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons 
        name="history" 
        size={80} 
        color={isDark ? '#555' : '#ccc'} 
      />
      <Text style={[styles.emptyStateTitle, isDark && styles.emptyStateTitleDark]}>
        Belum ada transaksi
      </Text>
      <Text style={[styles.emptyStateText, isDark && styles.emptyStateTextDark]}>
        Transaksi Anda akan muncul di sini setelah Anda melakukan aktivitas keuangan
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="auto" />
      <DashboardHeader 
        title="Aktivitas" 
        showBackButton={false}
      />
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'transaction' && styles.activeTabButton]}
          onPress={() => setActiveTab('transaction')}
        >
          <Text style={[styles.tabText, activeTab === 'transaction' && styles.activeTabText]}>
            Transaksi
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'others' && styles.activeTabButton]}
          onPress={() => setActiveTab('others')}
        >
          <Text style={[styles.tabText, activeTab === 'others' && styles.activeTabText]}>
            Lainnya
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Memuat transaksi...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.transactionList, transactions.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={renderEmptyState}
          removeClippedSubviews={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 80, // Fixed item height (72px card + 8px separator)
            offset: 80 * index,
            index,
          })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007BFF']}
              tintColor={isDark ? '#fff' : '#007BFF'}
            />
          }
        />
      )}
      
      <BottomNavBar />
    </SafeAreaView>
  );
}

// Create styles with dynamic values based on theme and dimensions
const createStyles = (isDark: boolean, width: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: isDark ? '#2A2A2A' : '#E8EEF4',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: isDark ? '#3A3A3A' : '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#888' : '#888',
  },
  activeTabText: {
    color: isDark ? '#FFFFFF' : '#333333',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  loadingTextDark: {
    color: '#AAA',
  },
  transactionList: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100, // Extra padding for bottom nav
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: 400,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateTitleDark: {
    color: '#FFF',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 250,
  },
  emptyStateTextDark: {
    color: '#AAA',
  },
});
