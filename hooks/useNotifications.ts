import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { Logger } from '../lib/logger';

// Define notification interface
export interface Notification {
  id: string;
  anggota_id: string;
  judul: string;
  pesan: string;
  jenis: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

// Fetch notifications from Supabase
const fetchNotifications = async (memberId: string): Promise<Notification[]> => {
  Logger.info('Notifications', 'Fetching notifications', { memberId });
  
  const { data, error } = await supabase
    .from('notifikasi')
    .select('*')
    .eq('anggota_id', memberId)
    .order('created_at', { ascending: false });

  if (error) {
    Logger.error('Notifications', 'Error fetching notifications', error);
    throw error;
  }
  
  Logger.debug('Notifications', `Found ${data?.length || 0} notifications`);
  return data || [];
};

// Mark notification as read
const markAsRead = async (notificationId: string): Promise<boolean> => {
  Logger.info('Notifications', 'Marking notification as read', { notificationId });
  
  const { error } = await supabase
    .from('notifikasi')
    .update({ is_read: true })
    .eq('id', notificationId);
    
  if (error) {
    Logger.error('Notifications', 'Error marking notification as read', error);
    throw error;
  }
  
  return true;
};

// Mark all notifications as read
const markAllAsRead = async (memberId: string): Promise<boolean> => {
  Logger.info('Notifications', 'Marking all notifications as read', { memberId });
  
  const { error } = await supabase
    .from('notifikasi')
    .update({ is_read: true })
    .eq('anggota_id', memberId)
    .eq('is_read', false);
    
  if (error) {
    Logger.error('Notifications', 'Error marking all notifications as read', error);
    throw error;
  }
  
  return true;
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
