import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { format, parseISO } from 'date-fns';

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

export function TransactionCard({
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
      year: format(date, 'yyyy')
    };
  };

  const formattedDate = formatTransactionDate(date);
  const displayName = recipientName || description;
  const displayDescription = bankName || (category ? `Transfer to ${category.replace('_', ' ')}` : description);

  return (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={onPress}
    >
      <View style={styles.dateColumn}>
        <Text style={styles.dayText}>{formattedDate.day}</Text>
        <Text style={styles.monthText}>{formattedDate.month}</Text>
        <Text style={styles.yearText}>{formattedDate.year}</Text>
      </View>
      
      <View style={styles.detailsColumn}>
        <Text style={styles.transactionName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {displayDescription}
        </Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Successful</Text>
        </View>
      </View>
      
      <View style={styles.amountColumn}>
        <Text style={[
          styles.amountText,
          type === 'masuk' ? styles.creditAmount : styles.debitAmount
        ]}>
          {type === 'masuk' ? '+' : '-'} {formatCurrency(Number(amount))}
        </Text>
        <TouchableOpacity style={styles.detailButton}>
          <Text style={styles.detailButtonIcon}>›</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateColumn: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 12,
    color: '#666',
  },
  yearText: {
    fontSize: 12,
    color: '#999',
  },
  detailsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  statusContainer: {
    backgroundColor: '#e6f7e6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#28a745',
  },
  amountColumn: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  creditAmount: {
    color: '#28a745',
  },
  debitAmount: {
    color: '#dc3545',
  },
  detailButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailButtonIcon: {
    fontSize: 18,
    color: '#666',
  },
});
