import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  anggota_id: string;
  judul: string;
  pesan: string;
  jenis: 'info' | 'transaksi' | 'sistem' | 'pengumuman';
  is_read: boolean;
  data?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Service for handling notifications
 */
export const NotificationService = {
  /**
   * Get all notifications for the current member
   */
  async getNotifications(anggotaId: string): Promise<Notification[]> {
    try {
      console.log(`Fetching notifications for anggota ID: ${anggotaId}`);
      
      const { data, error } = await supabase
        .from('notifikasi')
        .select('*')
        .eq('anggota_id', anggotaId)
        .order('created_at', { ascending: false });
      
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
      const { error } = await supabase
        .from('notifikasi')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
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
      const { error } = await supabase
        .from('notifikasi')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
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
