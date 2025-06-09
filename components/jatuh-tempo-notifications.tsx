import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/auth-context';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Logger, LogCategory } from '../lib/logger';
import { Ionicons } from '@expo/vector-icons';
import { NotificationService } from '../services/notification.service';

// Import the Notification type from NotificationService and extend it for our specific needs
type JatuhTempoNotification = {
  id: string;
  judul: string;
  pesan: string; 
  jenis: string;
  is_read: boolean;
  created_at: string;
  // Add any additional fields needed for jatuh tempo notifications
  data?: {
    loanId: string;
    installmentDate: string;
    installmentAmount: number;
    loanType: string;
    totalPayment: number;
    remainingPayment: number;
  };
  anggota_id?: string; // Make this optional to match NotificationService type
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
        
        // Use NotificationService to get notifications by type
        const data = await NotificationService.getNotificationsByType(member.id, 'jatuh_tempo');
        
        if (data && data.length > 0) {
          Logger.info(LogCategory.NOTIFICATIONS, 'Found jatuh tempo notifications', { count: data.length });
          
          // Sort by created_at
          const sortedData = [...data].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          // Convert to JatuhTempoNotification type
          const typedData = sortedData as JatuhTempoNotification[];
          setNotifications(typedData);
        } else {
          Logger.info(LogCategory.NOTIFICATIONS, 'No jatuh tempo notifications found');
          setNotifications([]);
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
      Logger.debug(LogCategory.NOTIFICATIONS, `Marking jatuh tempo notification ${notificationId} as read`);
      
      // Use NotificationService to mark notification as read
      const success = await NotificationService.markAsRead(notificationId);
      
      if (!success) {
        Logger.error(LogCategory.NOTIFICATIONS, `Failed to mark notification ${notificationId} as read`);
      } else {
        Logger.info(LogCategory.NOTIFICATIONS, `Successfully marked notification ${notificationId} as read`);
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
      Logger.error(LogCategory.NOTIFICATIONS, 'Error in markNotificationAsRead:', err);
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
