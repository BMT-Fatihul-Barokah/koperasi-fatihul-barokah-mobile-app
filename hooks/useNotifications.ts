import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { Logger } from '../lib/logger';
import { NotificationService, Notification } from '../services/notification.service';

// Re-export the Notification type from the service
export type { Notification } from '../services/notification.service';

// Fetch notifications from Supabase using the NotificationService
const fetchNotifications = async (memberId: string): Promise<Notification[]> => {
  Logger.info('Notifications', 'Fetching notifications', { memberId });
  
  try {
    const notifications = await NotificationService.getNotifications(memberId);
    Logger.debug('Notifications', `Found ${notifications.length} notifications`);
    return notifications;
  } catch (error) {
    Logger.error('Notifications', 'Error fetching notifications', error);
    throw error;
  }
};

// Mark notification as read using the NotificationService
const markAsRead = async (notificationId: string): Promise<boolean> => {
  Logger.info('Notifications', 'Marking notification as read', { notificationId });
  
  try {
    const success = await NotificationService.markAsRead(notificationId);
    if (!success) {
      Logger.error('Notifications', 'Failed to mark notification as read');
      return false;
    }
    return true;
  } catch (error) {
    Logger.error('Notifications', 'Error marking notification as read', error);
    throw error;
  }
};

// Mark all notifications as read using the NotificationService
const markAllAsRead = async (memberId: string): Promise<boolean> => {
  Logger.info('Notifications', 'Marking all notifications as read', { memberId });
  
  try {
    const success = await NotificationService.markAllAsRead(memberId);
    if (!success) {
      Logger.error('Notifications', 'Failed to mark all notifications as read');
      return false;
    }
    return true;
  } catch (error) {
    Logger.error('Notifications', 'Error marking all notifications as read', error);
    throw error;
  }
};

// Custom hook to use notifications with caching
export function useNotifications() {
  const { member, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Query hook for notifications
  const query = useQuery({
    queryKey: ['notifications', member?.id],
    queryFn: () => fetchNotifications(member?.id || ''),
    enabled: !!isAuthenticated && !!member?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Calculate unread count
  const unreadCount = (query.data || []).filter(notification => !notification.is_read).length;
  
  // Mutation for marking a notification as read
  const markNotificationAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      // Invalidate notifications cache to trigger a refetch
      if (member?.id) {
        queryClient.invalidateQueries({ queryKey: ['notifications', member.id] });
      }
    },
  });
  
  // Mutation for marking all notifications as read
  const markAllNotificationsAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(member?.id || ''),
    onSuccess: () => {
      // Invalidate notifications cache to trigger a refetch
      if (member?.id) {
        queryClient.invalidateQueries({ queryKey: ['notifications', member.id] });
      }
    },
  });
  
  // Manually refetch notifications
  const refetch = async () => {
    if (isAuthenticated && member?.id) {
      return query.refetch();
    }
  };
  
  // Invalidate notifications cache
  const invalidateNotifications = () => {
    if (member?.id) {
      queryClient.invalidateQueries({ queryKey: ['notifications', member.id] });
    }
  };
  
  return {
    notifications: query.data || [],
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidateNotifications,
    markNotificationAsRead: markNotificationAsReadMutation.mutate,
    markAllNotificationsAsRead: markAllNotificationsAsReadMutation.mutate,
  };
}
