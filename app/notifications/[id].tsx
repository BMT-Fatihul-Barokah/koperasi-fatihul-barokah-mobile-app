import React, { useEffect, useState, useMemo, useCallback } from 'react';
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

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member } = useAuth();
  const { markNotificationAsRead } = useData();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Create styles with dynamic values based on theme
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  // Fetch notification details
  useEffect(() => {
    if (!id || !member?.id) return;
    
    const fetchNotificationDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Fetching notification details for ID: ${id}`);
        
        // Fetch notification from Supabase
        const { data, error } = await supabase
          .from('notifikasi')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching notification details:', error);
          setError('Failed to fetch notification details');
          setIsLoading(false);
          return;
        }
        
        if (!data) {
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
        
        // Mark as read if not already read
        if (!data.is_read) {
          console.log(`Marking notification ${id} as read, type: ${data.jenis}`);
          
          try {
            // For transaction notifications, directly update using Supabase
            if (data.jenis === 'transaksi') {
              console.log('Using direct Supabase update for transaction notification');
              const { error: updateError } = await supabase
                .from('notifikasi')
                .update({ 
                  is_read: true,
                  updated_at: new Date().toISOString() 
                })
                .eq('id', id);
                
              if (updateError) {
                console.error('Error directly updating transaction notification:', updateError);
                throw new Error('Failed to update transaction notification');
              }
              
              console.log(`Successfully updated transaction notification ${id} directly`);
              // Update local state to reflect the change
              setNotification(prev => prev ? { ...prev, is_read: true } : null);
            } else {
              // For other notification types, use the context method
              const success = await markNotificationAsRead(id);
              
              if (success) {
                console.log(`Successfully marked notification ${id} as read`);
                // Update local state to reflect the change
                setNotification(prev => prev ? { ...prev, is_read: true } : null);
              } else {
                console.error(`Failed to mark notification ${id} as read`);
              }
            }
          } catch (error) {
            console.error('Error marking notification as read:', error);
          }
        } else {
          console.log(`Notification ${id} is already marked as read`);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchNotificationDetails:', error);
        setError('An error occurred while fetching notification details');
        setIsLoading(false);
      }
    };
    
    fetchNotificationDetails();
  }, [id, member?.id, markNotificationAsRead]);

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
          console.log('Navigating to transaction detail:', transactionId);
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
      console.error('Error handling related action:', error);
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
