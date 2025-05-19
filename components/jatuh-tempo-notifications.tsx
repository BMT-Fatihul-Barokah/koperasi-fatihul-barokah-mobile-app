import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Logger, LogCategory } from '../lib/logger';
import { Ionicons } from '@expo/vector-icons';

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
  const { member } = useAuth();
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
  
  // Function to mark a notification as read
  async function markNotificationAsRead(notificationId: string) {
    try {
      console.log(`Marking jatuh tempo notification ${notificationId} as read`);
      
      // First check if the notification exists to avoid the PGRST116 error
      const { data: checkData, error: checkError } = await supabase
        .from('notifikasi')
        .select('id')
        .eq('id', notificationId);
      
      if (checkError || !checkData || checkData.length === 0) {
        console.log('Notification not found or error checking:', checkError);
        // Still update local state even if the server update fails
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true } 
              : notification
          )
        );
        return;
      }
      
      // Update the notification
      const { error } = await supabase
        .from('notifikasi')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
      }
      
      // Update local state regardless of server result
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
    } catch (err) {
      console.error('Error in markNotificationAsRead:', err);
      // Still update local state even if there's an exception
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
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
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notificationItem,
              !item.is_read && styles.unreadNotification
            ]}
            onPress={() => {
              // Mark notification as read when pressed
              markNotificationAsRead(item.id);
            }}
          >
            <View style={styles.notificationIconContainer}>
              <Ionicons 
                name="calendar-outline" 
                size={24} 
                color="#dc3545" 
              />
            </View>
            
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{item.judul}</Text>
                {!item.is_read && <View style={styles.unreadDot} />}
              </View>
              
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.pesan}
              </Text>
              
              <Text style={styles.notificationTime}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    color: '#6c757d',
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007BFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6c757d',
  },
});
