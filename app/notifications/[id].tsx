import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { DashboardHeader } from '../../components/header/dashboard-header';
import { useAuth } from '../../context/auth-context';
import { useData } from '../../context/data-context';
import { Notification, NOTIFICATION_TYPES, NotificationService } from '../../services/notification.service';
import { supabase } from '../../lib/supabase';
import { Logger, LogCategory } from '../../lib/logger';

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notificationId = id as string;
  const { member } = useAuth();
  const { markNotificationAsRead, fetchNotifications } = useData();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markedAsRead, setMarkedAsRead] = useState(false);
  const didAttemptMarkAsRead = useRef(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Create styles with dynamic values based on theme
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  // Log when component mounts and handle cleanup
  useEffect(() => {
    Logger.debug(LogCategory.NOTIFICATIONS, 'Notification detail screen loaded', { notificationId });
    
    // Cleanup when unmounting
    return () => {
      if (markedAsRead) {
        Logger.debug(LogCategory.NOTIFICATIONS, 'Notification detail screen unmounting, refreshing notifications');
        // Force refresh notifications when navigating away if we marked as read
        fetchNotifications(true);
      }
    };
  }, [markedAsRead, fetchNotifications, notificationId]);

  // Fetch notification details - only run once when component mounts
  useEffect(() => {
    if (!notificationId || !member?.id) return;

    const fetchNotificationDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        Logger.debug(LogCategory.NOTIFICATIONS, `Fetching notification details for ID: ${notificationId}`);

        // Fetch notification from Supabase using maybeSingle to avoid errors
        const { data, error } = await supabase
          .from('notifikasi')
          .select('*')
          .eq('id', notificationId)
          .maybeSingle();

        if (error) {
          Logger.error(LogCategory.NOTIFICATIONS, 'Error fetching notification details:', error);
          setError('Failed to fetch notification details');
          setIsLoading(false);
          return;
        }

        if (!data) {
          Logger.debug(LogCategory.NOTIFICATIONS, `Notification ${notificationId} not found in database, checking for jatuh_tempo notification`);

          // For jatuh_tempo notifications, use the existing get_jatuh_tempo_notifications function as a fallback
          try {
            if (member?.id) {
              const { data: jatuhTempoData, error: jatuhTempoError } = await supabase
                .rpc('get_jatuh_tempo_notifications', { 
                  member_id: member.id 
                }) as {
                  data: any[] | null;
                  error: any;
                };

              if (jatuhTempoError) {
                Logger.error(LogCategory.NOTIFICATIONS, 'Error fetching jatuh_tempo notifications:', jatuhTempoError);
                throw jatuhTempoError;
              }

              if (jatuhTempoData && jatuhTempoData.length > 0) {
                // Find the specific notification by ID
                const targetNotification = jatuhTempoData.find(notification => notification.id === notificationId);

                if (targetNotification) {
                  Logger.debug(LogCategory.NOTIFICATIONS, 'Found jatuh_tempo notification via get_jatuh_tempo_notifications');
                  setNotification(targetNotification as Notification);
                  setIsLoading(false);
                  return;
                } else {
                  Logger.debug(LogCategory.NOTIFICATIONS, `Notification with ID ${notificationId} not found in jatuh_tempo notifications`);
                }
              }
            }
          } catch (fallbackError) {
            Logger.error(LogCategory.NOTIFICATIONS, 'Error in jatuh_tempo fallback:', fallbackError);
          }

          setError('Notification not found');
          setIsLoading(false);
          return;
        }

        // Check if this notification belongs to the current member
        if (data.anggota_id !== member.id) {
          // Check if it's a system notification that should be visible to all
          const isSystemNotification = data.jenis === 'sistem' || data.jenis === 'pengumuman';

          if (!isSystemNotification) {
            setError('You do not have permission to view this notification');
            setIsLoading(false);
            return;
          }
        }

        // Set notification data
        setNotification(data as Notification);
        setIsLoading(false);
      } catch (error) {
        Logger.error(LogCategory.NOTIFICATIONS, 'Error in fetchNotificationDetails:', error);
        setError('An error occurred while fetching notification details');
        setIsLoading(false);
      }
    };

    fetchNotificationDetails();
  }, [notificationId, member?.id]);

  // Mark notification as read after it's loaded - only run once when notification is available
  useEffect(() => {
    // Skip if already attempted to mark as read, no notification, or already loading
    if (didAttemptMarkAsRead.current || !notification || isLoading) {
      return;
    }

    const markAsRead = async () => {
      didAttemptMarkAsRead.current = true;

      // If already read, no need to mark again
      if (notification.is_read) {
        Logger.debug(LogCategory.NOTIFICATIONS, `Notification ${notificationId} is already marked as read`);
        return;
      }

      Logger.debug(LogCategory.NOTIFICATIONS, `Marking notification ${notificationId} as read, type: ${notification.jenis}`);

      try {
        // For transaction notifications, directly update using Supabase
        if (notification.jenis === 'transaksi') {
          Logger.debug(LogCategory.NOTIFICATIONS, 'Using direct Supabase update for transaction notification');
          const { error: updateError } = await supabase
            .from('notifikasi')
            .update({ 
              is_read: true,
              updated_at: new Date().toISOString() 
            })
            .eq('id', notificationId);

          if (updateError) {
            Logger.error(LogCategory.NOTIFICATIONS, 'Error directly updating transaction notification:', updateError);
            throw new Error('Failed to update transaction notification');
          }

          Logger.debug(LogCategory.NOTIFICATIONS, `Successfully updated transaction notification ${notificationId} directly`);
          // Update local state to reflect the change
          setNotification(prev => prev ? { ...prev, is_read: true } : null);
          setMarkedAsRead(true);
        } else if (notification.jenis === 'jatuh_tempo') {
          Logger.debug(LogCategory.NOTIFICATIONS, 'Using enhanced approach for jatuh_tempo notification');
          // For jatuh_tempo notifications, use our specialized RPC function

          // 1. First try the specialized RPC function
          try {
            Logger.debug(LogCategory.NOTIFICATIONS, `Using mark_jatuh_tempo_notification_as_read RPC function for ${notificationId}`);
            const { data: updateResult, error: updateError } = await supabase
              .rpc('mark_jatuh_tempo_notification_as_read', {
                notification_id: notificationId,
                member_id: member.id
              }) as {
                data: boolean | null;
                error: any;
              };
            
            if (updateError) {
              Logger.error(LogCategory.NOTIFICATIONS, `Error using mark_jatuh_tempo_notification_as_read for ${notificationId}:`, updateError);
              
              // Fall back to direct DB update if RPC function fails
              try {
                Logger.debug(LogCategory.NOTIFICATIONS, `Falling back to direct update for jatuh_tempo notification ${notificationId}`);
                const { error } = await supabase
                  .from('notifikasi')
                  .update({ 
                    is_read: true,
                    updated_at: new Date().toISOString() 
                  })
                  .eq('id', notificationId);
                  
                if (error) {
                  Logger.debug(LogCategory.NOTIFICATIONS, 'Direct update failed for jatuh_tempo notification, this is expected:', error);
                } else {
                  Logger.debug(LogCategory.NOTIFICATIONS, 'Direct update succeeded for jatuh_tempo notification');
                }
              } catch (directError) {
                Logger.debug(LogCategory.NOTIFICATIONS, 'Error in direct update for jatuh_tempo notification:', directError);
              }
            } else {
              if (updateResult === true) {
                Logger.debug(LogCategory.NOTIFICATIONS, `Successfully marked jatuh_tempo notification ${notificationId} as read via RPC`);
              } else {
                Logger.debug(LogCategory.NOTIFICATIONS, `RPC function returned false for ${notificationId}, notification might not exist in DB`);
              }
            }
          } catch (rpcError) {
            Logger.error(LogCategory.NOTIFICATIONS, `Error calling mark_jatuh_tempo_notification_as_read RPC for ${notificationId}:`, rpcError);
          }

          // 2. Also use the context method which will update local state
          const success = await markNotificationAsRead(notificationId);

          if (success) {
            Logger.debug(LogCategory.NOTIFICATIONS, `Successfully marked jatuh_tempo notification ${notificationId} as read via context`);
          } else {
            Logger.debug(LogCategory.NOTIFICATIONS, `Context method may have failed for jatuh_tempo ${notificationId}, updating UI locally`);
          }

          // 3. Always update local state in this component
          setNotification(prev => prev ? { ...prev, is_read: true } : null);
          setMarkedAsRead(true);

          // 4. Force refresh notifications to ensure consistency
          fetchNotifications(true);
        } else {
          // For other notification types, use the context method
          const success = await markNotificationAsRead(notificationId);

          if (success) {
            Logger.debug(LogCategory.NOTIFICATIONS, `Successfully marked notification ${notificationId} as read`);
            // Update local state to reflect the change
            setNotification(prev => prev ? { ...prev, is_read: true } : null);
            setMarkedAsRead(true);
          } else {
            Logger.error(LogCategory.NOTIFICATIONS, `Failed to mark notification ${notificationId} as read`);
          }
        }
      } catch (error) {
        Logger.error(LogCategory.NOTIFICATIONS, 'Error marking notification as read:', error);
      }
    };

    markAsRead();
  }, [notification, isLoading, notificationId, markNotificationAsRead, fetchNotifications]);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMMM yyyy, HH:mm', { locale: idLocale });
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  // Get notification type info
  const getNotificationTypeInfo = useCallback((type: string) => {
    return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
  }, []);

  // Handle related action based on notification type and data
  const handleRelatedAction = useCallback(() => {
    if (!notification) return;
    
    try {
      // Handle based on notification type
      if (notification.jenis === 'transaksi') {
        // Check for transaksi_id (Indonesian) or transaction_id (English) in data
        const transactionId = notification.data?.transaksi_id || notification.data?.transaction_id;
        
        if (transactionId) {
          // Navigate to transaction detail
          Logger.debug(LogCategory.NOTIFICATIONS, 'Navigating to transaction detail:', transactionId);
          router.push(`/activity/${transactionId}`);
          return;
        }
        
        // If no transaction ID found, show alert
        Alert.alert('Info', 'Detail transaksi tidak ditemukan');
      } else if (notification.jenis === 'jatuh_tempo' && notification.data?.loan_id) {
        // Navigate to loan detail
        router.push(`/loans/${notification.data.loan_id}`);
      } else {
        // No related action for this notification type
        Alert.alert('Info', 'Tidak ada tindakan terkait untuk notifikasi ini');
      }
    } catch (error) {
      Logger.error(LogCategory.NOTIFICATIONS, 'Error handling related action:', error);
      Alert.alert('Error', 'Gagal menjalankan tindakan terkait');
    }
  }, [notification]);

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardHeader 
          title="Detail Notifikasi" 
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Memuat detail notifikasi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardHeader 
          title="Detail Notifikasi" 
          showBackButton={true}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render notification not found
  if (!notification) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardHeader 
          title="Detail Notifikasi" 
          showBackButton={true}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
          <Text style={styles.errorText}>Notifikasi tidak ditemukan</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get notification type info
  const typeInfo = getNotificationTypeInfo(notification.jenis);
  const hasRelatedAction = 
    (notification.jenis === 'transaksi' && (notification.data?.transaksi_id || notification.data?.transaction_id)) || 
    (notification.jenis === 'jatuh_tempo' && notification.data?.loan_id);
    
  // Format currency for transaction amount
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Render transaction details if this is a transaction notification
  const renderTransactionDetails = () => {
    if (notification?.jenis !== 'transaksi' || !notification.data) return null;
    
    const { jenis, jumlah } = notification.data;
    let transactionType = '';
    
    // Map transaction type to human-readable text
    switch(jenis) {
      case 'setoran':
        transactionType = 'Setoran';
        break;
      case 'penarikan':
        transactionType = 'Penarikan';
        break;
      case 'transfer':
        transactionType = 'Transfer';
        break;
      case 'angsuran':
        transactionType = 'Pembayaran Angsuran';
        break;
      case 'bagi_hasil':
        transactionType = 'Bagi Hasil';
        break;
      default:
        transactionType = 'Transaksi';
    }
    
    return (
      <View style={styles.transactionDetailsContainer}>
        <Text style={styles.dataTitle}>Detail Transaksi:</Text>
        
        <View style={styles.transactionDetail}>
          <Text style={styles.dataKey}>Jenis:</Text>
          <Text style={styles.dataValue}>{transactionType}</Text>
        </View>
        
        {jumlah && (
          <View style={styles.transactionDetail}>
            <Text style={styles.dataKey}>Jumlah:</Text>
            <Text style={styles.dataValue}>{formatCurrency(jumlah)}</Text>
          </View>
        )}
        
        {notification.data.penerima && (
          <View style={styles.transactionDetail}>
            <Text style={styles.dataKey}>Penerima:</Text>
            <Text style={styles.dataValue}>{notification.data.penerima}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader 
        title="Detail Notifikasi" 
        showBackButton={true}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Notification header */}
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons 
              name={typeInfo.icon as any} 
              size={32} 
              color={typeInfo.color} 
            />
          </View>
          
          <View style={styles.typeContainer}>
            <Text style={styles.typeText}>{typeInfo.name}</Text>
          </View>
        </View>
        
        {/* Notification content */}
        <View style={styles.contentBox}>
          <Text style={styles.title}>{notification.judul}</Text>
          <Text style={styles.timestamp}>{formatDate(notification.created_at)}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.message}>{notification.pesan}</Text>
          
          {/* Render specialized transaction details for transaction notifications */}
          {notification.jenis === 'transaksi' ? (
            renderTransactionDetails()
          ) : (
            /* For other notification types, show raw data if available */
            notification.data && Object.keys(notification.data).length > 0 && (
              <View style={styles.dataContainer}>
                <Text style={styles.dataTitle}>Informasi Tambahan:</Text>
                {Object.entries(notification.data).map(([key, value]) => (
                  <Text key={key} style={styles.dataItem}>
                    <Text style={styles.dataKey}>{key.replace(/_/g, ' ')}:</Text> {String(value)}
                  </Text>
                ))}
              </View>
            )
          )}
        </View>
        
        {/* Related action button if applicable */}
        {hasRelatedAction && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleRelatedAction}
          >
            <Text style={styles.actionButtonText}>
              {notification.jenis === 'transaksi' 
                ? 'Lihat Detail Transaksi' 
                : notification.jenis === 'jatuh_tempo'
                ? 'Lihat Detail Pinjaman'
                : 'Lihat Detail'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Create styles with dynamic values based on theme
const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: isDark ? '#e0e0e0' : '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeContainer: {
    backgroundColor: isDark ? '#333333' : '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#ffffff' : '#333333',
  },
  contentBox: {
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#333333',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    color: isDark ? '#999999' : '#666666',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: isDark ? '#333333' : '#e0e0e0',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: isDark ? '#e0e0e0' : '#333333',
    marginBottom: 16,
  },
  dataContainer: {
    backgroundColor: isDark ? '#252525' : '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#e0e0e0' : '#333333',
    marginBottom: 8,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dataKey: {
    fontWeight: 'bold',
    color: isDark ? '#e0e0e0' : '#333333',
  },
  dataValue: {
    flex: 1,
    color: isDark ? '#e0e0e0' : '#333333',
    textAlign: 'right',
  },
  transactionDetailsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    borderRadius: 8,
  },
  transactionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#444444' : '#e0e0e0',
  },
  actionButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
