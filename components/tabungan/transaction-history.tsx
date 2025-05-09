import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatDateTime, getTransactionColor } from '../../lib/format-utils';

interface Transaction {
  id: string;
  tipe_transaksi: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  saldo_sebelum: number;
  saldo_sesudah: number;
  created_at: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEndReached?: () => void;
}

export function TransactionHistory({ 
  transactions, 
  isLoading, 
  onEndReached 
}: TransactionHistoryProps) {
  if (isLoading && (!transactions || transactions.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
      </View>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={64} color="#CCCCCC" />
        <Text style={styles.emptyText}>Belum ada transaksi</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIconContainer}>
        <View 
          style={[
            styles.iconCircle, 
            { backgroundColor: getTransactionColor(item.tipe_transaksi) }
          ]}
        >
          <Ionicons 
            name={item.tipe_transaksi === 'masuk' ? 'arrow-down-outline' : 'arrow-up-outline'} 
            size={18} 
            color="white" 
          />
        </View>
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.deskripsi}</Text>
        <Text style={styles.transactionDate}>{formatDateTime(item.created_at)}</Text>
      </View>
      
      <View style={styles.transactionAmount}>
        <Text 
          style={[
            styles.amountText, 
            { color: getTransactionColor(item.tipe_transaksi) }
          ]}
        >
          {item.tipe_transaksi === 'masuk' ? '+' : '-'} {formatCurrency(item.jumlah)}
        </Text>
        <Text style={styles.balanceText}>Saldo: {formatCurrency(item.saldo_sesudah)}</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isLoading ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="#007BFF" />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  transactionItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  transactionIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 12,
    color: '#666',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
