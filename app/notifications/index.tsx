import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useColorScheme,
  ScrollView,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth-context';
import { useData } from '../../context/data-context';
import { JatuhTempoNotifications } from '../../components/jatuh-tempo-notifications';
// Import Notification type from our custom types file
import { Notification } from '../../lib/notification.types';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StandardHeader } from '../../components/header/standard-header';
import { NotificationService } from '../../services/notification.service';
import { 
  NOTIFICATION_TYPES, 
  TransactionNotificationData,
  parseNotificationData,
  isTransactionNotificationData 
} from '../../lib/notification.types';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';
import { supabase } from '../../lib/supabase';
import { Logger, LogCategory } from '../../lib/logger';

// Filter type for notifications
type FilterType = 'all' | 'unread' | 'transaksi' | 'pengumuman' | 'sistem' | 'jatuh_tempo';

export default function NotificationsScreen() {
  const { member } = useAuth();
  const { 
    notifications, 
    fetchNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingNotification, setIsProcessingNotification] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Store filter preference when it changes
  const storeFilterPreference = async (filter: FilterType) => {
    try {
      await AsyncStorage.setItem('notification_filter_preference', filter);
    } catch (error) {
      Logger.error(LogCategory.NOTIFICATIONS, 'Error storing filter preference', error);
    }
  };
  
  // Set active filter and store preference
  const setAndStoreActiveFilter = (filter: FilterType) => {
    setActiveFilter(filter);
    storeFilterPreference(filter);
  };
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Create styles with dynamic values based on theme
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  // Load notifications and restore filter preference when component mounts
  useEffect(() => {
    if (member?.id) {
      Logger.info(LogCategory.NOTIFICATIONS, 'Fetching notifications on mount', { memberId: member.id });
      fetchNotifications(true); // Force refresh on mount
      
      // Direct check for notifications in Supabase
      checkNotificationsDirectly(member.id);
      
      // Restore filter preference
      const restoreFilterPreference = async () => {
        try {
          const storedFilter = await AsyncStorage.getItem('notification_filter_preference');
          if (storedFilter && ['all', 'unread', 'transaksi', 'pengumuman', 'sistem', 'jatuh_tempo'].includes(storedFilter)) {
            setActiveFilter(storedFilter as FilterType);
            Logger.debug(LogCategory.NOTIFICATIONS, 'Restored filter preference', { filter: storedFilter });
          }
        } catch (error) {
          Logger.error(LogCategory.NOTIFICATIONS, 'Error restoring filter preference', error);
        }
      };
      
      restoreFilterPreference();
    }
  }, [member?.id]); // Removed fetchNotifications from dependencies
  
  // Refresh notifications and restore filter when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (member?.id) {
        Logger.info(LogCategory.NOTIFICATIONS, 'Screen focused, refreshing notifications');
        fetchNotifications(true);
        
        // Restore filter preference when returning to the screen
        const restoreFilterPreference = async () => {
          try {
            const storedFilter = await AsyncStorage.getItem('notification_filter_preference');
            if (storedFilter && ['all', 'unread', 'transaksi', 'pengumuman', 'sistem', 'jatuh_tempo'].includes(storedFilter)) {
              setActiveFilter(storedFilter as FilterType);
              Logger.debug(LogCategory.NOTIFICATIONS, 'Restored filter preference on focus', { filter: storedFilter });
            }
          } catch (error) {
            Logger.error(LogCategory.NOTIFICATIONS, 'Error restoring filter preference on focus', error);
          }
        };
        
        restoreFilterPreference();
      }
      
      // No cleanup needed for useFocusEffect
      return () => {};
    }, [member?.id, fetchNotifications])
  );
  
  // Handle transaction notification press
  const handleTransactionPress = useCallback((notification) => {
    // Check if this is a transaction notification
    if (notification.jenis === 'transaksi' || notification.source === 'transaction') {
      // Extract transaction ID from notification data using type-safe parsing
      let transactionId = null;
      
      if (notification.data) {
        // Parse the data with type safety
        const transactionData = parseNotificationData<TransactionNotificationData>(notification.data);
        
        if (transactionData) {
          // Try to get transaction ID from data
          if (transactionData.transaksi_id) {
            transactionId = transactionData.transaksi_id;
          } else if (transactionData.transaction_id) {
            transactionId = transactionData.transaction_id;
          }
        }
      }
      
      // If we found a transaction ID, navigate to transaction detail
      if (transactionId) {
        Logger.debug(LogCategory.NOTIFICATIONS, 'Navigating to transaction detail', { transactionId });
        router.push(`/transactions/${transactionId}`);
        return true;
      }
    }
    
    return false;
  }, []);

  // Direct check for notifications using NotificationService
  const checkNotificationsDirectly = async (memberId: string) => {
    try {
      Logger.debug(LogCategory.NOTIFICATIONS, 'Checking notifications directly using NotificationService', { memberId });
      
      // Fetch all notifications using NotificationService
      const allNotifications = await NotificationService.getNotifications(memberId);
      
      if (!allNotifications || allNotifications.length === 0) {
        Logger.info(LogCategory.NOTIFICATIONS, 'No notifications found via NotificationService');
        return;
      }
      
      // Log summary information about notifications
      Logger.info(LogCategory.NOTIFICATIONS, 'Number of notifications found', { count: allNotifications.length });
      
      // Check for jatuh_tempo notifications specifically
      const jatuhTempoNotifications = await NotificationService.getNotificationsByType(memberId, 'jatuh_tempo');
      Logger.info(LogCategory.NOTIFICATIONS, 'Found due date notifications', { count: jatuhTempoNotifications.length || 0 });
      
      // Check for transaction notifications specifically
      const transactionNotifications = allNotifications.filter(n => n.jenis === 'transaksi') || [];
      Logger.debug(LogCategory.NOTIFICATIONS, 'Transaction notifications found', { count: transactionNotifications.length });
      
      // Count notification types for logging
      const typeCount: Record<string, number> = {};
      if (allNotifications && allNotifications.length > 0) {
        allNotifications.forEach(n => {
          if (n && n.jenis) {
            typeCount[n.jenis] = (typeCount[n.jenis] || 0) + 1;
          }
        });
      }
      Logger.info(LogCategory.NOTIFICATIONS, 'Notification summary', { hasDueDateNotifications: jatuhTempoNotifications.length > 0, types: typeCount });
    } catch (error) {
      Logger.error(LogCategory.NOTIFICATIONS, 'Error in notification direct check', error);
    }
  };

  


  // Refresh notifications
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotifications(true); // Force refresh
    setIsRefreshing(false);
  }, [fetchNotifications]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
  }, [markNotificationAsRead]);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (notifications.unreadCount === 0) return;
    
    const success = await markAllNotificationsAsRead();
    if (success) {
      Alert.alert('Success', 'All notifications marked as read');
    } else {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  }, [notifications.unreadCount, markAllNotificationsAsRead]);

  // Handle notification press
  const handleNotificationPress = useCallback(async (notification: Notification) => {
    try {
      setIsProcessingNotification(true);
      Logger.debug(LogCategory.NOTIFICATIONS, `Pressed notification ID ${notification.id}`, { type: notification.jenis });

      // For all notification types, use the context method
      // The context method now has special handling for jatuh_tempo notifications using RPC
      const result = await markNotificationAsRead(notification.id);
      
      if (result) {
        Logger.debug(LogCategory.NOTIFICATIONS, `Successfully marked notification ${notification.id} as read`);
      } else {
        Logger.warn(LogCategory.NOTIFICATIONS, `Failed to mark notification ${notification.id} as read through context method`);
        
        // If context method fails for jatuh_tempo notification, try using NotificationService directly as fallback
        if (notification.jenis === 'jatuh_tempo') {
          Logger.debug(LogCategory.NOTIFICATIONS, `Attempting direct NotificationService update for jatuh_tempo`, { id: notification.id });
          try {
            const success = await NotificationService.markAsRead(notification.id, notification.source);
            
            if (!success) {
              Logger.error(LogCategory.NOTIFICATIONS, `NotificationService direct update failed`, { id: notification.id });
            } else {
              Logger.debug(LogCategory.NOTIFICATIONS, `NotificationService direct update successful`, { id: notification.id });
            }
          } catch (serviceError) {
            Logger.error(LogCategory.NOTIFICATIONS, `Error in NotificationService direct update`, { id: notification.id, error: serviceError });
          }
        }
      }

      // Check if this is a transaction notification
      if (handleTransactionPress(notification)) {
        return;
      }

      // For jatuh_tempo notifications, log navigation separately
      if (notification.jenis === 'jatuh_tempo') {
        Logger.debug(LogCategory.NOTIFICATIONS, 'Navigating to jatuh_tempo notification detail', { id: notification.id });
      } else {
        // For all other notifications
        Logger.debug(LogCategory.NOTIFICATIONS, 'Navigating to notification detail', { id: notification.id });
      }
      
      // Navigate to the notification detail screen
      router.push(`/notifications/${notification.id}`);
    } catch (error) {
      Logger.error(LogCategory.NOTIFICATIONS, 'Error handling notification press:', error);
    } finally {
      setIsProcessingNotification(false);
    }
  }, [markNotificationAsRead, fetchNotifications, router]);

  // Format relative time
  const formatRelativeTime = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      const now = new Date();
      
      // If less than 24 hours ago, show relative time
      if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
        return formatDistanceToNow(date, { 
          addSuffix: true,
          locale: idLocale
        });
      }
      
      // Otherwise show formatted date
      return format(date, 'dd MMM yyyy, HH:mm', { locale: idLocale });
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  // Get icon for notification type
  const getNotificationIcon = useCallback((type: string) => {
    // Default to info if the type doesn't exist in NOTIFICATION_TYPES
    const typeInfo = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    
    return (
      <Ionicons 
        name={(typeInfo?.icon || 'information-circle-outline') as any} 
        size={24} 
        color={typeInfo?.color || '#17a2b8'} 
      />
    );
  }, []);
  
  // Filter notifications based on active filter
  const filteredNotifications = useMemo(() => {
    // Apply filters to notifications data
    
    if (activeFilter === 'all') {
      return notifications.data;
    } else if (activeFilter === 'unread') {
      return notifications.data.filter(item => !item.is_read);
    } else if (activeFilter === 'transaksi') {
      // Filter by source field for transaction notifications
      const filtered = notifications.data.filter(item => 
        item.source === 'transaction' || // New field
        item.jenis === 'transaksi'       // Legacy field
      );
      Logger.debug(LogCategory.NOTIFICATIONS, `Filtered ${filtered.length} transaction notifications`);
      return filtered;
    } else {
      const filtered = notifications.data.filter(item => item.jenis === activeFilter);
      Logger.debug(LogCategory.NOTIFICATIONS, `Filtered ${filtered.length} notifications for type ${activeFilter}`);
      return filtered;
    }
  }, [notifications.data, activeFilter]);

  // Render notification item
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIconContainer}>
        {getNotificationIcon(item.jenis)}
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
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Menu state and handlers
  const [menuVisible, setMenuVisible] = useState(false);
  const toggleMenu = () => setMenuVisible(!menuVisible);
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StandardHeader 
        title="Notifikasi" 
        showBackButton={false}
        rightIcon={{
          name: "ellipsis-vertical",
          onPress: toggleMenu
        }}
      />
      
      {/* Options Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, isDark && styles.menuContainerDark]}>
            {notifications.unreadCount > 0 && (
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  handleMarkAllAsRead();
                  setMenuVisible(false);
                }}
              >
                <Ionicons 
                  name="checkmark-done-outline" 
                  size={20} 
                  color={isDark ? '#e0e0e0' : '#333333'} 
                  style={styles.menuIcon} 
                />
                <Text style={[styles.menuText, isDark && styles.menuTextDark]}>Tandai semua sudah dibaca</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
            onPress={() => setAndStoreActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>Semua</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'unread' && styles.activeFilterTab]}
            onPress={() => setAndStoreActiveFilter('unread')}
          >
            <Text style={[styles.filterText, activeFilter === 'unread' && styles.activeFilterText]}>
              Belum Dibaca {notifications.unreadCount > 0 && `(${notifications.unreadCount})`}
            </Text>
          </TouchableOpacity>
          
          {/* Transaction filter - explicitly add this first */}
          <TouchableOpacity 
            key="transaksi"
            style={[styles.filterTab, activeFilter === 'transaksi' && styles.activeFilterTab]}
            onPress={() => setAndStoreActiveFilter('transaksi')}
          >
            <Text style={[styles.filterText, activeFilter === 'transaksi' && styles.activeFilterText]}>
              Transaksi
            </Text>
          </TouchableOpacity>
          
          {/* Jatuh Tempo filter - explicitly add this */}
          <TouchableOpacity 
            key="jatuh_tempo"
            style={[styles.filterTab, activeFilter === 'jatuh_tempo' && styles.activeFilterTab]}
            onPress={() => setAndStoreActiveFilter('jatuh_tempo')}
          >
            <Text style={[styles.filterText, activeFilter === 'jatuh_tempo' && styles.activeFilterText]}>
              Jatuh Tempo
            </Text>
          </TouchableOpacity>
          
          {/* Other notification types */}
          {NOTIFICATION_TYPES && Object.entries(NOTIFICATION_TYPES)
            .filter(([key]) => key !== 'transaksi' && key !== 'jatuh_tempo') // Skip transaksi and jatuh_tempo since we added them explicitly
            .map(([key, value]) => (
              <TouchableOpacity 
                key={key}
                style={[styles.filterTab, activeFilter === key && styles.activeFilterTab]}
                onPress={() => setAndStoreActiveFilter(key as FilterType)}
              >
                <Text style={[styles.filterText, activeFilter === key && styles.activeFilterText]}>
                  {value?.name || key}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>
      

      
      {/* Main content */}
      {activeFilter === 'jatuh_tempo' ? (
        // Show the dedicated JatuhTempoNotifications component when jatuh_tempo filter is active
        <JatuhTempoNotifications />
      ) : notifications.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Memuat notifikasi...</Text>
        </View>
      ) : notifications.error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
          <Text style={styles.errorText}>Gagal memuat notifikasi</Text>
          <Text style={styles.errorDetail}>{notifications.error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color="#6c757d" />
          <Text style={styles.emptyText}>
            {activeFilter === 'all'
              ? 'Tidak ada notifikasi'
              : activeFilter === 'unread'
              ? 'Tidak ada notifikasi yang belum dibaca'
              : `Tidak ada notifikasi ${NOTIFICATION_TYPES[activeFilter]?.name || activeFilter}`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#007BFF']}
              tintColor={isDark ? '#ffffff' : '#007BFF'}
            />
          }
        />
      )}
      
      <BottomNavBar />
    </SafeAreaView>
  );
}

// Create styles with dynamic values based on theme
const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#f8f9fa',
  },

  filterContainer: {
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#e0e0e0',
  },
  filterContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: isDark ? '#333333' : '#f0f0f0',
    marginRight: 8,
  },
  activeFilterTab: {
    backgroundColor: '#007BFF',
  },
  filterText: {
    fontSize: 14,
    color: isDark ? '#e0e0e0' : '#333333',
  },
  activeFilterText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#007BFF',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  markAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    marginTop: 60,  // Position below header
    marginRight: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
    overflow: 'hidden',
  },
  menuContainerDark: {
    backgroundColor: '#333333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    color: '#333333',
  },
  menuTextDark: {
    color: '#e0e0e0',
  },

  spacer: {
    width: 40,
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
    color: isDark ? '#f8f9fa' : '#333333',
    marginTop: 10,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 14,
    color: isDark ? '#cccccc' : '#666666',
    marginTop: 5,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: isDark ? '#e0e0e0' : '#666',
    marginTop: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 10,
  },
  notificationItem: {
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: isDark ? '#1a2a3a' : '#E6F2FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#333333' : '#f0f0f0',
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
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007BFF',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: isDark ? '#cccccc' : '#666666',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: isDark ? '#999999' : '#999999',
  },
});
