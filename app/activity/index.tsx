import React, { useState, useMemo } from 'react';
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
import { TransactionCard } from '../../components/transaction/TransactionCard';
import { DashboardHeader } from '../../components/header/dashboard-header';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useTransactions, Transaction } from '../../hooks/useTransactions';

// Previously had tab types, now simplified to just transactions

export default function ActivityScreen() {
  const { isAuthenticated, member } = useAuth();
  const { transactions, isLoading, refetch } = useTransactions();
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Create styles with dynamic values based on theme and dimensions
  const styles = useMemo(() => createStyles(isDark, width), [isDark, width]);

  // Redirect to login if not authenticated
  if (!isAuthenticated && !member) {
    router.replace('/');
  }
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
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
      {/* No header - clean minimal interface */}
      
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007BFF']}
              tintColor={isDark ? '#FFFFFF' : '#007BFF'}
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
  // Styles for the activity page content
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
