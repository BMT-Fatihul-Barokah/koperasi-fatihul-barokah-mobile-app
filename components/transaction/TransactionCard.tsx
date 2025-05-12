import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  useColorScheme
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface TransactionCardProps {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'masuk' | 'keluar';
  category?: string;
  recipientName?: string;
  bankName?: string;
  onPress?: () => void;
}

// Memoize the component to prevent unnecessary re-renders
export const TransactionCard = React.memo(function TransactionCard({
  id,
  date,
  description,
  amount,
  type,
  category,
  recipientName,
  bankName,
  onPress
}: TransactionCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date for display
  const formatTransactionDate = (dateString: string) => {
    const date = parseISO(dateString);
    return {
      day: format(date, 'd'),
      month: format(date, 'MMM'),
      year: format(date, 'yyyy'),
      fullDate: format(date, 'd MMM yyyy'),
      time: format(date, 'HH:mm')
    };
  };

  const formattedDate = formatTransactionDate(date);
  const displayName = recipientName || description;
  const displayDescription = bankName || (category ? `Transfer ke ${category.replace('_', ' ')}` : description);
  
  // Determine transaction icon based on category
  const getTransactionIcon = () => {
    if (category === 'transfer') {
      return <MaterialCommunityIcons name="bank-transfer" size={24} color="white" />;
    } else if (category === 'pembayaran') {
      return <MaterialCommunityIcons name="cash-multiple" size={24} color="white" />;
    } else if (category === 'tabungan') {
      return <MaterialCommunityIcons name="piggy-bank" size={24} color="white" />;
    } else if (category === 'pinjaman') {
      return <MaterialCommunityIcons name="cash-refund" size={24} color="white" />;
    } else {
      return <Ionicons name="wallet-outline" size={24} color="white" />;
    }
  };
  
  // Determine gradient colors based on transaction type and category
  const getGradientColors = () => {
    if (type === 'masuk') {
      return ['#00875A', '#20B982'] as const;
    } else {
      if (category === 'transfer') {
        return ['#0066CC', '#0095FF'] as const;
      } else if (category === 'pembayaran') {
        return ['#9C27B0', '#BA68C8'] as const;
      } else {
        return ['#E53935', '#FF5252'] as const;
      }
    }
  };
  
  // Get transaction status text
  const getStatusText = () => {
    return 'Berhasil';
  };

  return (
    <TouchableOpacity 
      style={[styles.transactionItem, isDark && styles.transactionItemDark]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.transactionContent}>
        <LinearGradient
          colors={getGradientColors()}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {getTransactionIcon()}
        </LinearGradient>
        
        <View style={styles.detailsColumn}>
          <View style={styles.transactionHeader}>
            <Text style={[styles.transactionName, isDark && styles.transactionNameDark]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[
              styles.amountText,
              type === 'masuk' ? styles.creditAmount : styles.debitAmount,
              isDark && (type === 'masuk' ? styles.creditAmountDark : styles.debitAmountDark)
            ]}>
              {type === 'masuk' ? '+' : '-'}{formatCurrency(Number(amount))}
            </Text>
          </View>
          
          <View style={styles.transactionFooter}>
            <Text style={[styles.transactionDescription, isDark && styles.transactionDescriptionDark]} numberOfLines={1}>
              {displayDescription}
            </Text>
            
            <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
              {formattedDate.fullDate} • {formattedDate.time}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.chevronContainer}>
        <Ionicons 
          name="chevron-forward" 
          size={18} 
          color={isDark ? '#666' : '#CCC'} 
        />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    alignItems: 'center',
    height: 72, // Fixed height to prevent layout shifts
  },
  transactionItemDark: {
    backgroundColor: '#1E1E1E',
    shadowOpacity: 0.2,
  },
  transactionContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsColumn: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  transactionNameDark: {
    color: '#FFFFFF',
  },
  transactionDescription: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  transactionDescriptionDark: {
    color: '#AAAAAA',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    height: 20, // Fixed height to prevent layout shifts
  },
  statusContainer: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusSuccess: {
    backgroundColor: 'rgba(40, 167, 69, 0.15)',
  },
  statusInfo: {
    backgroundColor: 'rgba(0, 123, 255, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#28a745',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  dateTextDark: {
    color: '#777',
  },
  amountText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  creditAmount: {
    color: '#28a745',
  },
  creditAmountDark: {
    color: '#4CAF50',
  },
  debitAmount: {
    color: '#dc3545',
  },
  debitAmountDark: {
    color: '#F44336',
  },
  chevronContainer: {
    paddingRight: 12,
    height: '100%',
    justifyContent: 'center',
  }
});
