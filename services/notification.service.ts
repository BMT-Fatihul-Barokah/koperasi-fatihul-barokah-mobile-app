import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  anggota_id: string;
  judul: string;
  pesan: string;
  jenis: 'transaksi' | 'sistem' | 'pengumuman' | 'jatuh_tempo';
  is_read: boolean;
  data?: any;
  created_at: string;
  updated_at: string;
}

export interface NotificationTypeInfo {
  name: string;
  icon: string;
  color: string;
  isPushEnabled: boolean;
  isGlobal: boolean;
}

export const NOTIFICATION_TYPES: Record<string, NotificationTypeInfo> = {
  transaksi: {
    name: 'Transaksi',
    icon: 'cash-outline',
    color: '#28a745',
    isPushEnabled: true,
    isGlobal: false
  },
  pengumuman: {
    name: 'Pengumuman',
    icon: 'megaphone-outline',
    color: '#0066CC',
    isPushEnabled: false,
    isGlobal: true
  },
  sistem: {
    name: 'Sistem',
    icon: 'settings-outline',
    color: '#6c757d',
    isPushEnabled: false,
    isGlobal: true
  },
  jatuh_tempo: {
    name: 'Jatuh Tempo',
    icon: 'calendar-outline',
    color: '#dc3545',
    isPushEnabled: true,
    isGlobal: false
  }
}

/**
 * Service for handling notifications
 */
export const NotificationService = {
  /**
   * Create a notification
   */
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      console.log('Creating notification:', notification);
      
      const { error } = await supabase
        .from('notifikasi')
        .insert([
          {
            ...notification,
            is_read: notification.is_read ?? false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }
      
      console.log('Notification created successfully');
      return true;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return false;
    }
  },
  /**
   * Get all notifications for the current member
   */
  async getNotifications(anggotaId: string, limit = 50): Promise<Notification[]> {
    try {
      console.log(`Fetching notifications for anggota ID: ${anggotaId}`);
      
      const { data, error } = await supabase
        .from('notifikasi')
        .select('*')
        .eq('anggota_id', anggotaId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Failed to fetch notifications');
      }
      
      return data as Notification[];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      throw error;
    }
  },
  
  /**
   * Get notifications by type
   */
  async getNotificationsByType(anggotaId: string, type: string, limit = 20): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifikasi')
        .select('*')
        .eq('anggota_id', anggotaId)
        .eq('jenis', type)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error(`Error fetching ${type} notifications:`, error);
        throw new Error(`Failed to fetch ${type} notifications`);
      }
      
      return data as Notification[];
    } catch (error) {
      console.error(`Error in getNotificationsByType (${type}):`, error);
      throw error;
    }
  },
  
  /**
   * Get notification types info
   */
  getNotificationTypeInfo(type: string): NotificationTypeInfo {
    return NOTIFICATION_TYPES[type] || {
      name: 'Lainnya',
      icon: 'notifications-outline',
      color: '#6c757d',
      isPushEnabled: false,
      isGlobal: false
    };
  },
  
  /**
   * Get unread notification count
   */
  async getUnreadCount(anggotaId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifikasi')
        .select('*', { count: 'exact', head: true })
        .eq('anggota_id', anggotaId)
        .eq('is_read', false);
      
      if (error) {
        console.error('Error counting unread notifications:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  },
  
  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      console.log(`Marking notification as read: ${notificationId}`);
      
      const { error } = await supabase
        .from('notifikasi')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  },
  
  /**
   * Mark all notifications as read for a member
   */
  async markAllAsRead(anggotaId: string): Promise<boolean> {
    try {
      console.log(`Marking all notifications as read for anggota ID: ${anggotaId}`);
      
      const { error } = await supabase
        .from('notifikasi')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('anggota_id', anggotaId)
        .eq('is_read', false);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }
};
