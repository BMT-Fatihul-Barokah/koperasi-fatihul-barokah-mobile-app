import { supabase } from '../lib/supabase';

// Base notification interface
export interface BaseNotification<T = any> {
  id: string;
  judul: string;
  pesan: string;
  jenis: 'transaksi' | 'sistem' | 'pengumuman' | 'jatuh_tempo';
  data?: T;
  created_at: string;
  updated_at: string;
}

// Global notification interface
export interface GlobalNotification<T = any> extends BaseNotification<T> {
  // Global notifications don't have anggota_id directly
  source: 'global';
}

// Global notification read status
export interface GlobalNotificationRead {
  id: string;
  global_notifikasi_id: string;
  anggota_id: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// Transaction notification interface
export interface TransaksiNotification<T = any> extends BaseNotification<T> {
  transaksi_id?: string;
  is_read: boolean;
  source: 'transaction';
}

// Combined notification type for app usage
export interface Notification<T = any> extends BaseNotification<T> {
  anggota_id?: string;
  is_read: boolean;
  source: 'global' | 'transaction';
  transaksi_id?: string;
}

// Define specific data types for different notification types
export interface TransactionNotificationData {
  transaksi_id?: string;
  transaction_id?: string;
  jenis?: string;
  jumlah?: number;
  tanggal?: string;
}

export interface DueDateNotificationData {
  loan_id?: string;
  amount?: number;
  due_date?: string;
}

export interface SystemNotificationData {
  action_url?: string;
  priority?: 'low' | 'medium' | 'high';
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
  },
  // Default fallback for any unrecognized types
  info: {
    name: 'Info',
    icon: 'information-circle-outline',
    color: '#17a2b8',
    isPushEnabled: false,
    isGlobal: false
  }
}

/**
 * Service for handling notifications
 */
// Type guard functions for notification data types
export function isTransactionNotificationData(data: any): data is TransactionNotificationData {
  return data && 
    (typeof data.transaksi_id === 'string' || 
     typeof data.transaction_id === 'string' || 
     typeof data.jenis === 'string');
}

export function isDueDateNotificationData(data: any): data is DueDateNotificationData {
  return data && 
    (typeof data.loan_id === 'string' || 
     typeof data.due_date === 'string');
}

export function isSystemNotificationData(data: any): data is SystemNotificationData {
  return data && 
    (typeof data.action_url === 'string' || 
     (typeof data.priority === 'string' && 
      ['low', 'medium', 'high'].includes(data.priority)));
}

// Helper function to parse notification data with type safety
export function parseNotificationData<T>(data: string | object | null | undefined): T | undefined {
  if (!data) return undefined;
  
  try {
    if (typeof data === 'string') {
      return JSON.parse(data) as T;
    } else {
      return data as T;
    }
  } catch (error) {
    console.error('Error parsing notification data:', error);
    return undefined;
  }
}

export const NotificationService = {
  /**
   * Create a notification
   */
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      console.log('Creating notification:', notification);
      
      // Determine if this is a global notification or transaction notification
      const isGlobal = notification.source === 'global' || 
        ['pengumuman', 'sistem'].includes(notification.jenis);
      
      if (isGlobal) {
        // Create global notification
        const { error: globalError } = await supabase
          .from('global_notifikasi')
          .insert([{
            judul: notification.judul,
            pesan: notification.pesan,
            jenis: notification.jenis,
            data: notification.data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (globalError) {
          console.error('Error creating global notification:', globalError);
          return false;
        }
        
        // If anggota_id is provided, mark it as read/unread for that specific member
        if (notification.anggota_id) {
          // Get the latest notification we just created
          const { data: latestNotif, error: fetchError } = await supabase
            .from('global_notifikasi')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (fetchError || !latestNotif || latestNotif.length === 0) {
            console.error('Error fetching created notification:', fetchError);
            return false;
          }
          
          const { error: readError } = await supabase
            .from('global_notifikasi_read')
            .insert([{
              global_notifikasi_id: latestNotif[0].id,
              anggota_id: notification.anggota_id,
              is_read: notification.is_read ?? false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);
            
          if (readError) {
            console.error('Error creating notification read status:', readError);
            return false;
          }
        }
      } else {
        // Create transaction notification
        const { error } = await supabase
          .from('transaksi_notifikasi')
          .insert([{
            judul: notification.judul,
            pesan: notification.pesan,
            jenis: notification.jenis,
            data: notification.data,
            is_read: notification.is_read ?? false,
            transaksi_id: notification.data?.transaksi_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (error) {
          console.error('Error creating transaction notification:', error);
          return false;
        }
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
      
      // Get all notifications using the new RPC function
      const { data: allNotificationsData, error: notificationsError } = await supabase
        .rpc('get_all_notifications')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (notificationsError) {
        console.error('Error fetching notifications:', notificationsError);
        return [];
      }
      
      // Get read status for global notifications
      const { data: readStatusData, error: readStatusError } = await supabase
        .rpc('get_notification_read_status', { p_anggota_id: anggotaId });
      
      if (readStatusError) {
        console.error('Error fetching notification read status:', readStatusError);
        // Continue with default read status
      }
      
      // Create a map of notification IDs to read status
      const readStatusMap = new Map();
      if (readStatusData) {
        readStatusData.forEach(item => {
          readStatusMap.set(item.notification_id, item.is_read);
        });
      }
      
      // Transform notifications to match the Notification interface
      const transformedNotifications = allNotificationsData.map(item => {
        // For global notifications, get read status from the map or default to false
        const isRead = item.source === 'global' 
          ? readStatusMap.get(item.id) ?? false 
          : item.is_read ?? false;
          
        return {
          id: item.id,
          judul: item.judul,
          pesan: item.pesan,
          jenis: item.jenis,
          data: item.data || {},
          created_at: item.created_at,
          updated_at: item.updated_at,
          is_read: isRead,
          source: item.source,
          transaksi_id: item.transaksi_id,
          anggota_id: anggotaId
        };
      });
      
      return transformedNotifications;
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return [];
    }
  },
  
  /**
   * Get notifications by type
   */
  async getNotificationsByType(anggotaId: string, type: string, limit = 20): Promise<Notification[]> {
    try {
      const isGlobalType = ['pengumuman', 'sistem'].includes(type);
      
      if (isGlobalType) {
        // Get global notifications of this type
        const { data, error } = await supabase
          .from('global_notifikasi')
          .select(`
            id,
            judul,
            pesan,
            jenis,
            data,
            created_at,
            updated_at,
            global_notifikasi_read!inner(id, anggota_id, is_read)
          `)
          .eq('jenis', type)
          .eq('global_notifikasi_read.anggota_id', anggotaId)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error) {
          console.error(`Error fetching ${type} notifications:`, error);
          throw new Error(`Failed to fetch ${type} notifications`);
        }
        
        // Transform to match the Notification interface
        return (data || []).map(item => ({
          id: item.id,
          judul: item.judul,
          pesan: item.pesan,
          jenis: item.jenis,
          data: item.data,
          created_at: item.created_at,
          updated_at: item.updated_at,
          is_read: item.global_notifikasi_read[0]?.is_read ?? false,
          anggota_id: anggotaId,
          is_global: true
        }));
      } else {
        // Get transaction notifications of this type
        const { data, error } = await supabase
          .from('transaksi_notifikasi')
          .select('*')
          .eq('jenis', type)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error) {
          console.error(`Error fetching ${type} notifications:`, error);
          throw new Error(`Failed to fetch ${type} notifications`);
        }
        
        // Transform to match the Notification interface
        return (data || []).map(item => ({
          id: item.id,
          judul: item.judul,
          pesan: item.pesan,
          jenis: item.jenis,
          data: item.data,
          created_at: item.created_at,
          updated_at: item.updated_at,
          is_read: item.is_read,
          is_global: false
        }));
      }
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
      // Count unread transaction notifications
      const { count: transactionCount, error: transactionError } = await supabase
        .from('transaksi_notifikasi')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      
      if (transactionError) {
        console.error('Error counting unread transaction notifications:', transactionError);
        return 0;
      }
      
      // Count unread global notifications
      const { count: globalCount, error: globalError } = await supabase
        .from('global_notifikasi_read')
        .select('*', { count: 'exact', head: true })
        .eq('anggota_id', anggotaId)
        .eq('is_read', false);
      
      if (globalError) {
        console.error('Error counting unread global notifications:', globalError);
        return transactionCount || 0;
      }
      
      return (transactionCount || 0) + (globalCount || 0);
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  },
  
  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, source?: 'global' | 'transaction'): Promise<boolean> {
    try {
      console.log(`Marking notification as read: ${notificationId}, source: ${source || 'unknown'}`);
      
      // If source is provided, use it to determine which table to update
      if (source === 'transaction') {
        // Update transaction notification
        const { data, error } = await supabase
          .from('transaksi_notifikasi')
          .update({ is_read: true, updated_at: new Date().toISOString() })
          .eq('id', notificationId)
          .select('id');
        
        if (error) {
          console.error('Error marking transaction notification as read:', error);
          return false;
        }
        
        return data && data.length > 0;
      } else if (source === 'global') {
        // Update global notification read status
        const { error } = await supabase
          .from('global_notifikasi_read')
          .update({ is_read: true, updated_at: new Date().toISOString() })
          .eq('global_notifikasi_id', notificationId);
        
        if (error) {
          console.error('Error marking global notification as read:', error);
          return false;
        }
        
        return true;
      } else {
        // If source is not provided, try both tables
        // First try transaction notifications
        const { data: transactionData, error: transactionError } = await supabase
          .from('transaksi_notifikasi')
          .update({ is_read: true, updated_at: new Date().toISOString() })
          .eq('id', notificationId)
          .select('id');
        
        if (!transactionError && transactionData && transactionData.length > 0) {
          return true;
        }
        
        // Then try global notifications
        const { data: globalData, error: globalFetchError } = await supabase
          .from('global_notifikasi_read')
          .select('id')
          .eq('global_notifikasi_id', notificationId);
        
        if (!globalFetchError && globalData && globalData.length > 0) {
          const { error: globalUpdateError } = await supabase
            .from('global_notifikasi_read')
            .update({ is_read: true, updated_at: new Date().toISOString() })
            .eq('global_notifikasi_id', notificationId);
          
          if (globalUpdateError) {
            console.error('Error marking global notification as read:', globalUpdateError);
            return false;
          }
          
          return true;
        }
        
        console.error('Notification not found in either table:', notificationId);
        return false;
      }
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
      
      let success = true;
      
      // Mark all transaction notifications as read
      const { error: transactionError } = await supabase
        .from('transaksi_notifikasi')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('is_read', false);
      
      if (transactionError) {
        console.error('Error marking all transaction notifications as read:', transactionError);
        success = false;
      }
      
      // Mark all global notifications as read for this member
      const { error: globalError } = await supabase
        .from('global_notifikasi_read')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('anggota_id', anggotaId)
        .eq('is_read', false);
      
      if (globalError) {
        console.error('Error marking all global notifications as read:', globalError);
        success = false;
      }
      
      return success;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }
};