import React, { useEffect, useCallback, useState, useMemo } from 'react';
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
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth-context';
import { useData } from '../../context/data-context';
// Notification type is now imported from data-context
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DashboardHeader } from '../../components/header/dashboard-header';
import { NOTIFICATION_TYPES, NotificationService } from '../../services/notification.service';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';
import { supabase } from '../../lib/supabase';

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
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Create styles with dynamic values based on theme
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  // Load notifications when component mounts - only once
  useEffect(() => {
    if (member?.id) {
      console.log('Notifications: Fetching notifications on mount');
      console.log('Member ID:', member.id);
      fetchNotifications(true); // Force refresh on mount
      
      // Direct check for notifications in Supabase
      checkNotificationsDirectly(member.id);
    }
  }, [member?.id]); // Removed fetchNotifications from dependencies
  
  // Direct check for notifications in Supabase (bypassing the data context)
  const checkNotificationsDirectly = async (memberId: string) => {
    try {
      console.log('Directly checking notifications for member:', memberId);
      
      // Check if the notifikasi table exists
      const { data: tableInfo, error: tableError } = await supabase
        .from('notifikasi')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('Error checking notifikasi table:', tableError);
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
        console.error('Error fetching notifications directly:', error);
        return;
      }
      
      console.log('Direct notification check result:', data);
      console.log('Number of notifications found:', data?.length || 0);
      
      // If we have notifications but they're not showing up in the UI,
      // there might be an issue with the data context
      if (data?.length > 0 && notifications.data.length === 0) {
        console.warn('Notifications found directly but not in data context!');
        // Force update the data context
        await fetchNotifications(true);
      }
    } catch (error) {
      console.error('Error in direct notification check:', error);
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
  const handleNotificationPress = useCallback(async (notification) => {
    try {
      // Mark notification as read
      await markNotificationAsRead(notification.id);
      
      // Handle notification based on type
      if (notification.jenis === 'transaksi' && notification.data?.transaction_id) {
        // Navigate to transaction detail
        router.push(`/activity/${notification.data.transaction_id}`);
      } else {
        // Navigate to notification detail screen
        router.push(`/notifications/${notification.id}`);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  }, [markNotificationAsRead]);

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
    if (activeFilter === 'all') {
      return notifications.data;
    } else if (activeFilter === 'unread') {
      return notifications.data.filter(item => !item.is_read);
    } else {
      return notifications.data.filter(item => item.jenis === activeFilter);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader 
        title="Notifikasi" 
        showBackButton={false}
        rightComponent={
          notifications.unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.markAllText}>Tandai Semua</Text>
            </TouchableOpacity>
          )
        }
      />
      
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
          
          {Object.entries(NOTIFICATION_TYPES).map(([key, value]) => (
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
      
      {notifications.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Memuat notifikasi...</Text>
        </View>
      ) : notifications.error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Gagal memuat notifikasi</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchNotifications(true)}
          >
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#cccccc" />
          <Text style={styles.emptyText}>Tidak ada notifikasi</Text>
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
    backgroundColor: isDark ? '#121212' : '#f5f5f5',
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
    color: '#dc3545',
    marginBottom: 16,
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
