import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
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
import { DashboardHeader } from '../../components/header/dashboard-header';
import { NOTIFICATION_TYPES, NotificationService } from '../../services/notification.service';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';
import { supabase } from '../../lib/supabase';
import { Logger, LogCategory } from '../../lib/logger';

// Filter type for notifications
type FilterType = 'all' | 'unread' | 'transaksi' | 'pengumuman' | 'info' | 'sistem' | 'jatuh_tempo';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Create styles with dynamic values based on theme
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  // Load notifications when component mounts
  useEffect(() => {
    if (member?.id) {
      Logger.info(LogCategory.NOTIFICATIONS, 'Fetching notifications on mount', { memberId: member.id });
      fetchNotifications(true); // Force refresh on mount
      
      // Direct check for notifications in Supabase
      checkNotificationsDirectly(member.id);
    }
  }, [member?.id]); // Removed fetchNotifications from dependencies
  
  // Refresh notifications when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (member?.id) {
        Logger.info(LogCategory.NOTIFICATIONS, 'Screen focused, refreshing notifications');
        fetchNotifications(true);
      }
      
      // No cleanup needed for useFocusEffect
      return () => {};
    }, [member?.id, fetchNotifications])
  );
  
  // Direct check for notifications in Supabase (bypassing the data context)
  const checkNotificationsDirectly = async (memberId: string) => {
    try {
      Logger.debug(LogCategory.NOTIFICATIONS, 'Checking notifications directly', { memberId });
      
      // Check if the notifikasi table exists
      const { data: tableInfo, error: tableError } = await supabase
        .from('notifikasi')
        .select('id')
        .limit(1);
      
      if (tableError) {
        Logger.error(LogCategory.NOTIFICATIONS, 'Error checking notifikasi table', tableError);
        return;
      }
      
      // Fetch notifications directly from Supabase
      // Include both personal notifications and system/announcement notifications
      const { data, error } = await supabase
        .from('notifikasi')
        .select('*')
        .or(`anggota_id.eq.${memberId},jenis.eq.sistem,jenis.eq.pengumuman`)
        .order('created_at', { ascending: false });
      
      if (error) {
        Logger.error(LogCategory.NOTIFICATIONS, 'Error fetching general notifications', error);
        return;
      }
      
      // Use the dedicated SQL function for jatuh_tempo notifications
      Logger.debug(LogCategory.NOTIFICATIONS, 'Using dedicated SQL function for jatuh_tempo notifications');
      // Cast the result as any to handle the type mismatch between varchar and text
      const { data: jatuhTempoData, error: jatuhTempoError } = await supabase
        .rpc('get_jatuh_tempo_notifications', { member_id: memberId }) as {
          data: any[] | null;
          error: any;
        };
      
      if (jatuhTempoError) {
        Logger.error(LogCategory.NOTIFICATIONS, 'Error calling get_jatuh_tempo_notifications function', jatuhTempoError);
      } else {
        Logger.info(LogCategory.NOTIFICATIONS, 'Found due date notifications via RPC', { count: jatuhTempoData?.length || 0 });
        
        if (jatuhTempoData && jatuhTempoData.length > 0) {
          // Add jatuh_tempo notifications to the data array if they exist
          if (data) {
            // Add jatuh_tempo notifications, avoiding duplicates
            jatuhTempoData.forEach(notification => {
              if (!data.some(n => n.id === notification.id)) {
                data.push(notification);
              }
            });
            
            // Re-sort by created_at
            data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          }
        } else {
          // Fallback to direct query if RPC returns no results
          Logger.debug(LogCategory.NOTIFICATIONS, 'No results from RPC function, trying direct query for jatuh_tempo');
          const { data: directJatuhTempoData, error: directJatuhTempoError } = await supabase
            .from('notifikasi')
            .select('*')
            .eq('anggota_id', memberId)
            .eq('jenis', 'jatuh_tempo')
            .order('created_at', { ascending: false });
          
          if (directJatuhTempoError) {
            Logger.error(LogCategory.NOTIFICATIONS, 'Error with direct jatuh_tempo query', directJatuhTempoError);
          } else if (directJatuhTempoData && directJatuhTempoData.length > 0) {
            Logger.info(LogCategory.NOTIFICATIONS, 'Found jatuh_tempo notifications via direct query', { count: directJatuhTempoData.length });
            
            // Add these notifications to our data array
            if (data) {
              directJatuhTempoData.forEach(notification => {
                if (!data.some(n => n.id === notification.id)) {
                  data.push(notification);
                }
              });
              
              // Re-sort by created_at
              data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }
          } else {
            Logger.info(LogCategory.NOTIFICATIONS, 'No jatuh_tempo notifications found via direct query');
          }
        }
      }
        
      // If we don't find transaction notifications, try a direct query
      if (!error && data && data.filter(n => n.jenis === 'transaksi').length === 0) {
        Logger.debug(LogCategory.NOTIFICATIONS, 'No transaction notifications found in main query, trying direct query');
        
        // Try a direct query specifically for transaction notifications
        const { data: transactionData, error: transactionError } = await supabase
          .from('notifikasi')
          .select('*')
          .eq('anggota_id', memberId)
          .eq('jenis', 'transaksi')
          .order('created_at', { ascending: false });
          
        if (!transactionError && transactionData && transactionData.length > 0) {
          Logger.info(LogCategory.NOTIFICATIONS, 'Found transaction notifications in direct query', { count: transactionData.length });
          // Add transaction notifications to the data array
          data.push(...transactionData);
          // Re-sort by created_at
          data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
      }
      
      if (error) {
        Logger.error(LogCategory.NOTIFICATIONS, 'Error fetching notifications directly', error);
        return;
      }
      
      // Log summary information about notifications
      Logger.info(LogCategory.NOTIFICATIONS, 'Number of notifications found', { count: data?.length || 0 });
      
      // Count notification types for logging
      const typeCount = {};
      data?.forEach(n => {
        typeCount[n.jenis] = (typeCount[n.jenis] || 0) + 1;
      });
      Logger.info(LogCategory.NOTIFICATIONS, 'Notification summary', { types: typeCount });
      
      // Check specifically for transaction notifications
      const transactionNotifications = data?.filter(n => n.jenis === 'transaksi') || [];
      Logger.debug(LogCategory.NOTIFICATIONS, 'Transaction notifications found', { count: transactionNotifications.length });
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
      console.log(`Notification Index: Pressed notification ID ${notification.id}, type ${notification.jenis}`);

      // For all notification types, use the context method
      // The context method now has special handling for jatuh_tempo notifications using RPC
      console.log(`Notification Index: Marking notification ${notification.id} as read via context method`);
      const result = await markNotificationAsRead(notification.id);
      
      if (result) {
        console.log(`Notification Index: Successfully marked notification ${notification.id} as read`);
      } else {
        console.warn(`Notification Index: Failed to mark notification ${notification.id} as read through context method`);
        
        // If context method fails for jatuh_tempo notification, try direct database update as fallback
        if (notification.jenis === 'jatuh_tempo') {
          console.log(`Notification Index: Attempting direct database update for jatuh_tempo ${notification.id}`);
          try {
            const { error } = await supabase
              .from('notifikasi')
              .update({ 
                is_read: true,
                updated_at: new Date().toISOString() 
              })
              .eq('id', notification.id);
            
            if (error) {
              console.error(`Notification Index: Direct database update failed for ${notification.id}:`, error);
            } else {
              console.log(`Notification Index: Direct database update successful for ${notification.id}`);
            }
          } catch (dbError) {
            console.error(`Notification Index: Error in direct database update for ${notification.id}:`, dbError);
          }
        }
      }

      // Navigate to transaction detail
      if (notification.jenis === 'transaksi') {
        console.log('Navigating to transaction:', notification.data?.transaksi_id || notification.data?.transaction_id);
        router.push(`/activity/${notification.data?.transaksi_id || notification.data?.transaction_id}`);
        return;
      } else if (notification.jenis === 'jatuh_tempo') {
        
        // Force mark as read in both database and local state
        // 1. Try direct update first
        try {
          console.log('Attempting direct database update for jatuh_tempo notification');
          const { error: directUpdateError } = await supabase
            .from('notifikasi')
            .update({ 
              is_read: true,
              updated_at: new Date().toISOString() 
            })
            .eq('id', notification.id);
          
          if (directUpdateError) {
            console.log('Direct update attempt failed, expected for some jatuh_tempo notifications');
          } else {
            console.log('Direct update succeeded for jatuh_tempo notification');
          }
        } catch (directError) {
          console.log('Error in direct update attempt:', directError);
        }
        
        // 2. Update in local state using context method
        await markNotificationAsRead(notification.id);
        
        // 3. Update the UI forcefully by refreshing notifications
        await fetchNotifications(true);
        
        // For jatuh_tempo notifications, force multiple refresh attempts
        // to ensure the read status is properly updated in the UI
        setTimeout(() => {
          console.log('Delayed refresh for jatuh_tempo notification');
          fetchNotifications(true);
          
          // Add another delayed refresh for extra reliability
          setTimeout(() => {
            console.log('Final refresh for jatuh_tempo notification');
            fetchNotifications(true);
          }, 500);
        }, 200);
        
        // Navigate to notification detail
        console.log('Navigating to jatuh_tempo notification detail:', notification.id);
        router.push(`/notifications/${notification.id}`);
        return;
      } else {
        // For other notification types, use the context method
        await markNotificationAsRead(notification.id);
      }
      
      // For all other notifications or if transaction ID not found
      console.log('Navigating to notification detail:', notification.id);
      router.push(`/notifications/${notification.id}`);
    } catch (error) {
      console.error('Error handling notification press:', error);
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
    const typeInfo = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    
    return (
      <Ionicons 
        name={typeInfo.icon as any} 
        size={24} 
        color={typeInfo.color} 
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
    } else {
      const filtered = notifications.data.filter(item => item.jenis === activeFilter);
      console.log(`Filtered ${filtered.length} notifications for type ${activeFilter}`);
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
      <DashboardHeader 
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
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>Semua</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'unread' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('unread')}
          >
            <Text style={[styles.filterText, activeFilter === 'unread' && styles.activeFilterText]}>
              Belum Dibaca {notifications.unreadCount > 0 && `(${notifications.unreadCount})`}
            </Text>
          </TouchableOpacity>
          
          {/* Transaction filter - explicitly add this first */}
          <TouchableOpacity 
            key="transaksi"
            style={[styles.filterTab, activeFilter === 'transaksi' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('transaksi')}
          >
            <Text style={[styles.filterText, activeFilter === 'transaksi' && styles.activeFilterText]}>
              Transaksi
            </Text>
          </TouchableOpacity>
          
          {/* Jatuh Tempo filter - explicitly add this */}
          <TouchableOpacity 
            key="jatuh_tempo"
            style={[styles.filterTab, activeFilter === 'jatuh_tempo' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('jatuh_tempo')}
          >
            <Text style={[styles.filterText, activeFilter === 'jatuh_tempo' && styles.activeFilterText]}>
              Jatuh Tempo
            </Text>
          </TouchableOpacity>
          
          {/* Other notification types */}
          {Object.entries(NOTIFICATION_TYPES)
            .filter(([key]) => key !== 'transaksi' && key !== 'jatuh_tempo') // Skip transaksi and jatuh_tempo since we added them explicitly
            .map(([key, value]) => (
              <TouchableOpacity 
                key={key}
                style={[styles.filterTab, activeFilter === key && styles.activeFilterTab]}
                onPress={() => setActiveFilter(key as FilterType)}
              >
                <Text style={[styles.filterText, activeFilter === key && styles.activeFilterText]}>
                  {value.name}
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
