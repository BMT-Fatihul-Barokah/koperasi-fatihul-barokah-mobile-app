import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, useColorScheme } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency, formatDateTime, getTransactionColor } from '../../lib/format-utils';
import { LinearGradient } from 'expo-linear-gradient';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  if (isLoading && (!transactions || transactions.length === 0)) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.loadingContainerDark]}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Memuat riwayat transaksi...</Text>
      </View>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={[styles.emptyContainer, isDark && styles.emptyContainerDark]}>
        <MaterialCommunityIcons name="file-document-outline" size={64} color={isDark ? "#555555" : "#CCCCCC"} />
        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>Belum ada transaksi</Text>
      </View>
    );
  }

  // Get transaction icon based on category
  const getTransactionIcon = (tipe: string, kategori: string) => {
    if (tipe === 'masuk') {
      switch (kategori) {
        case 'setoran':
          return <MaterialCommunityIcons name="cash-plus" size={18} color="white" />;
        case 'bagi_hasil':
          return <MaterialCommunityIcons name="percent" size={18} color="white" />;
        case 'bonus':
          return <MaterialCommunityIcons name="gift" size={18} color="white" />;
        default:
          return <MaterialCommunityIcons name="arrow-down" size={18} color="white" />;
      }
    } else {
      switch (kategori) {
        case 'penarikan':
          return <MaterialCommunityIcons name="cash-minus" size={18} color="white" />;
        case 'biaya_admin':
          return <MaterialCommunityIcons name="file-document" size={18} color="white" />;
        default:
          return <MaterialCommunityIcons name="arrow-up" size={18} color="white" />;
      }
    }
  };

  // Get gradient colors based on transaction type
  const getGradientColors = (tipe: string) => {
    if (tipe === 'masuk') {
      return isDark ? ['#1c7c54', '#2ec27e'] : ['#26a269', '#57e389'];
    } else {
      return isDark ? ['#a51d2d', '#e01b24'] : ['#e01b24', '#f66151'];
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionItem, isDark && styles.transactionItemDark]}>
      <View style={styles.transactionIconContainer}>
        <LinearGradient
          colors={getGradientColors(item.tipe_transaksi) as any}
          style={styles.iconCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {getTransactionIcon(item.tipe_transaksi, item.kategori)}
        </LinearGradient>
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionDescription, isDark && styles.transactionDescriptionDark]}>
          {item.deskripsi}
        </Text>
        <Text style={[styles.transactionDate, isDark && styles.transactionDateDark]}>
          {formatDateTime(item.created_at)}
        </Text>
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
        <Text style={[styles.balanceText, isDark && styles.balanceTextDark]}>
          Saldo: {formatCurrency(item.saldo_sesudah)}
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContainer, isDark && styles.listContainerDark]}
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
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
  },
  listContainerDark: {
    backgroundColor: '#1C1C1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  loadingContainerDark: {
    backgroundColor: '#1C1C1E',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  loadingTextDark: {
    color: '#A0A0A0',
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  emptyContainerDark: {
    backgroundColor: '#1C1C1E',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyTextDark: {
    color: '#A0A0A0',
  },
  transactionItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionItemDark: {
    backgroundColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  transactionIconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  transactionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333333',
  },
  transactionDescriptionDark: {
    color: '#FFFFFF',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionDateDark: {
    color: '#A0A0A0',
  },
  transactionAmount: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 100,
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
  balanceTextDark: {
    color: '#A0A0A0',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
