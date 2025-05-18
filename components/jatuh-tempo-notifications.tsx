import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Logger, LogCategory } from '../lib/logger';

interface JatuhTempoNotification {
  id: string;
  anggota_id: string;
  judul: string;
  pesan: string;
  jenis: string;
  is_read: boolean;
  data?: {
    loanId: string;
    installmentDate: string;
    installmentAmount: number;
    loanType: string;
    totalPayment: number;
    remainingPayment: number;
  };
  created_at: string;
}

export function JatuhTempoNotifications() {
  const { session, member } = useAuth();
  const [notifications, setNotifications] = useState<JatuhTempoNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJatuhTempoNotifications() {
      if (!member?.id) {
        Logger.debug(LogCategory.NOTIFICATIONS, 'No member ID available, skipping jatuh tempo notifications fetch');
        setLoading(false);
        return;
      }

      try {
        Logger.debug(LogCategory.NOTIFICATIONS, 'Fetching jatuh tempo notifications', { memberId: member.id });
        
        // Try using the RPC function first
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_jatuh_tempo_notifications', { member_id: member.id });
          
        if (!rpcError && rpcData && rpcData.length > 0) {
          Logger.info(LogCategory.NOTIFICATIONS, 'Found jatuh tempo notifications via RPC', { count: rpcData.length });
          setNotifications(rpcData);
        } else {
          // Fallback to direct query
          Logger.debug(LogCategory.NOTIFICATIONS, 'RPC failed or returned no results, trying direct query');
          const { data, error } = await supabase
            .from('notifikasi')
            .select('*')
            .eq('anggota_id', member.id)
            .eq('jenis', 'jatuh_tempo')
            .order('created_at', { ascending: false });
            
          if (error) {
            Logger.error(LogCategory.NOTIFICATIONS, 'Error fetching jatuh tempo notifications', error);
            setError('Failed to load notifications');
          } else if (data && data.length > 0) {
            Logger.info(LogCategory.NOTIFICATIONS, 'Found jatuh tempo notifications via direct query', { count: data.length });
            setNotifications(data);
          } else {
            Logger.info(LogCategory.NOTIFICATIONS, 'No jatuh tempo notifications found');
            setNotifications([]);
          }
        }
      } catch (err) {
        Logger.error(LogCategory.NOTIFICATIONS, 'Exception in jatuh tempo notifications fetch', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchJatuhTempoNotifications();
  }, [member?.id]);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID').format(amount);
  }

  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return format(date, 'd MMMM yyyy', { locale: id });
    } catch (err) {
      return dateString;
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading jatuh tempo notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No jatuh tempo notifications found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jatuh Tempo Notifications</Text>
      <Text style={styles.subtitle}>
        {notifications.length} notification{notifications.length !== 1 ? 's' : ''} found
      </Text>
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.notificationCard, item.is_read ? styles.readCard : styles.unreadCard]}>
            <Text style={styles.notificationTitle}>{item.judul}</Text>
            <Text style={styles.notificationDate}>
              {formatDate(item.created_at)}
            </Text>
            <Text style={styles.notificationMessage}>{item.pesan}</Text>
            
            {item.data && (
              <View style={styles.notificationDetails}>
                <Text style={styles.detailLabel}>Loan Type:</Text>
                <Text style={styles.detailValue}>{item.data.loanType}</Text>
                
                <Text style={styles.detailLabel}>Installment Date:</Text>
                <Text style={styles.detailValue}>{formatDate(item.data.installmentDate)}</Text>
                
                <Text style={styles.detailLabel}>Installment Amount:</Text>
                <Text style={styles.detailValue}>Rp {formatCurrency(item.data.installmentAmount)}</Text>
                
                <Text style={styles.detailLabel}>Total Payment:</Text>
                <Text style={styles.detailValue}>Rp {formatCurrency(item.data.totalPayment)}</Text>
                
                <Text style={styles.detailLabel}>Remaining Payment:</Text>
                <Text style={styles.detailValue}>Rp {formatCurrency(item.data.remainingPayment)}</Text>
              </View>
            )}
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, item.is_read ? styles.readIndicator : styles.unreadIndicator]} />
              <Text style={styles.statusText}>{item.is_read ? 'Read' : 'Unread'}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  notificationCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  readCard: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
  },
  unreadCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 16,
    marginBottom: 12,
  },
  notificationDetails: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: 'bold',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  readIndicator: {
    backgroundColor: '#6c757d',
  },
  unreadIndicator: {
    backgroundColor: '#007bff',
  },
  statusText: {
    fontSize: 14,
    color: '#6c757d',
  },
});
