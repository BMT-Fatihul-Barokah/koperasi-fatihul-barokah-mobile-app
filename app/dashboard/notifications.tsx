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
  useColorScheme
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth-context';
import { useData } from '../../context/data-context';
// Notification type is now imported from data-context
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { DashboardHeader } from '../../components/header/dashboard-header';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';

export default function NotificationsScreen() {
  const { member } = useAuth();
  const { 
    notifications, 
    fetchNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Create styles with dynamic values based on theme
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  // Load notifications when component mounts - only once
  useEffect(() => {
    if (member?.id) {
      console.log('Notifications: Fetching notifications on mount');
      fetchNotifications();
    }
  }, [member?.id]); // Removed fetchNotifications from dependencies

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
  const handleNotificationPress = useCallback((notification) => {
    // Mark as read
    handleMarkAsRead(notification.id);
    
    // Handle navigation based on notification type and data
    if (notification.data) {
      try {
        const data = notification.data;
        
        if (notification.jenis === 'transaksi' && data.transaksi_id) {
          // Navigate to transaction detail
          router.push(`/activity/detail?id=${data.transaksi_id}`);
        } else if (notification.jenis === 'pengumuman' && data.pengumuman_id) {
          // Navigate to announcement detail
          router.push(`/announcement/detail?id=${data.pengumuman_id}`);
        }
      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
    }
  }, [handleMarkAsRead]);

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
    switch (type) {
      case 'info':
        return <Ionicons name="information-circle" size={24} color="#007BFF" />;
      case 'transaksi':
        return <Ionicons name="cash-outline" size={24} color="#28a745" />;
      case 'sistem':
        return <Ionicons name="settings-outline" size={24} color="#6c757d" />;
      case 'pengumuman':
        return <Ionicons name="megaphone-outline" size={24} color="#fd7e14" />;
      default:
        return <Ionicons name="notifications-outline" size={24} color="#007BFF" />;
    }
  }, []);

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

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Tidak Ada Notifikasi</Text>
      <Text style={styles.emptyMessage}>
        Anda belum memiliki notifikasi saat ini.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader 
        title="Notifikasi" 
        showBackButton={false}
        rightComponent={
          notifications.unreadCount > 0 ? (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.markAllText}>Tandai Semua</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      
      {notifications.unreadCount === 0 && <View style={styles.spacer} />}
      
      {notifications.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Memuat notifikasi...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications.data}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || notifications.isLoading}
              onRefresh={handleRefresh}
              colors={['#007BFF']}
              tintColor="#007BFF"
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
    backgroundColor: isDark ? '#121212' : '#f8f8f8',
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
    color: '#666',
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 10,
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#E6F2FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
    color: '#333',
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
    color: '#666',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 36,
    height: 36,
    marginBottom: 6,
  },
  activeNavIcon: {
    tintColor: '#007BFF',
  },
  navText: {
    fontSize: 14,
    color: '#999',
  },
  activeNavText: {
    color: '#007BFF',
  }
});
