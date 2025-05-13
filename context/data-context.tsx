import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth-context';
import { Anggota } from '../lib/database.types';

interface Transaction {
  id: string;
  anggota_id: string;
  tipe_transaksi: 'masuk' | 'keluar';
  kategori: string;
  deskripsi: string;
  reference_number?: string;
  jumlah: number;
  created_at: string;
  recipient_name?: string;
  bank_name?: string;
}

interface Notification {
  id: string;
  anggota_id: string;
  judul: string;
  pesan: string;
  jenis: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

interface DataState {
  transactions: {
    data: Transaction[];
    lastFetched: number | null;
    isLoading: boolean;
    error: Error | null;
  };
  notifications: {
    data: Notification[];
    unreadCount: number;
    lastFetched: number | null;
    isLoading: boolean;
    error: Error | null;
  };
}

interface DataContextType extends DataState {
  fetchTransactions: (forceRefresh?: boolean) => Promise<void>;
  fetchNotifications: (forceRefresh?: boolean) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<boolean>;
  markAllNotificationsAsRead: () => Promise<boolean>;
  clearCache: () => void;
}

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Initial data state
const initialState: DataState = {
  transactions: {
    data: [],
    lastFetched: null,
    isLoading: false,
    error: null,
  },
  notifications: {
    data: [],
    unreadCount: 0,
    lastFetched: null,
    isLoading: false,
    error: null,
  },
};

// Create data context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Data provider component
export function DataProvider({ children }: { children: React.ReactNode }) {
  const { member, isAuthenticated } = useAuth();
  const [state, setState] = useState<DataState>(initialState);

  // Clear cache when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearCache();
    }
  }, [isAuthenticated]);

  // Fetch transactions
  const fetchTransactions = useCallback(async (forceRefresh = false) => {
    // If not authenticated or no member, return
    if (!isAuthenticated || !member) return;
    
    // Check if cache is valid and we're not forcing a refresh
    const now = Date.now();
    const lastFetched = state.transactions.lastFetched;
    const dataLength = state.transactions.data.length;
    
    const isCacheValid = lastFetched && 
      (now - lastFetched < CACHE_EXPIRATION);
    
    if (isCacheValid && !forceRefresh && dataLength > 0) {
      console.log('Data Context: Using cached transactions data');
      return;
    }
    
    setState(prev => ({
      ...prev,
      transactions: {
        ...prev.transactions,
        isLoading: true,
        error: null,
      }
    }));
    
    try {
      console.log('Data Context: Fetching transactions from API');
      const { data, error } = await supabase
        .from('transaksi')
        .select('*')
        .eq('anggota_id', member.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Data Context: Error fetching transactions:', error);
        setState(prev => ({
          ...prev,
          transactions: {
            ...prev.transactions,
            isLoading: false,
            error: error as Error,
          }
        }));
        return;
      }

      // Add recipient data for transfer transactions
      const transactionsWithRecipients = data.map(tx => {
        let recipientName, bankName;
        
        if (tx.kategori === 'transfer') {
          if (tx.deskripsi?.includes('BLU')) {
            recipientName = 'NOVANDRA ANUGRAH';
            bankName = 'BLU BY BCA DIGITAL';
          } else if (tx.deskripsi?.includes('SHOPEE')) {
            recipientName = 'SHOPEE - nXXXXXXXX9';
            bankName = 'BCA Virtual Account';
          } else if (tx.deskripsi?.includes('OVO')) {
            recipientName = 'NOVANDRA ANUGRAH';
            bankName = 'OVO';
          }
        }
        
        return {
          ...tx,
          recipient_name: recipientName,
          bank_name: bankName
        };
      });
      
      setState(prev => ({
        ...prev,
        transactions: {
          data: transactionsWithRecipients,
          lastFetched: now,
          isLoading: false,
          error: null,
        }
      }));
    } catch (error) {
      console.error('Data Context: Error in transaction fetch:', error);
      setState(prev => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          isLoading: false,
          error: error as Error,
        }
      }));
    }
  }, [isAuthenticated, member]);  // Removed state dependencies to prevent infinite loops

  // Fetch notifications
  const fetchNotifications = useCallback(async (forceRefresh = false) => {
    // If not authenticated or no member, return
    if (!isAuthenticated || !member) {
      console.log('Data Context: Not authenticated or no member, skipping notification fetch');
      return;
    }
    
    console.log('Data Context: Member ID for notifications:', member.id);
    
    // Check if cache is valid and we're not forcing a refresh
    const now = Date.now();
    // Get current state values to avoid dependency on state object
    const lastFetched = state.notifications.lastFetched;
    const dataLength = state.notifications.data.length;
    
    const isCacheValid = lastFetched && 
      (now - lastFetched < CACHE_EXPIRATION);
    
    if (isCacheValid && !forceRefresh && dataLength > 0) {
      console.log('Data Context: Using cached notifications data, count:', dataLength);
      return;
    }
    
    setState(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        isLoading: true,
        error: null,
      }
    }));
    
    try {
      console.log('Data Context: Fetching notifications from API for member:', member.id);
      
      // We'll assume the notifikasi table exists in your Supabase database
      // If it doesn't, you'll need to create it through the Supabase dashboard
      
      // Now fetch notifications from the table - both personal and system notifications
      // We need to fetch both personal notifications and system/announcement notifications
      // that should be visible to all users
      const { data, error } = await supabase
        .from('notifikasi') // Use lowercase table name
        .select('*')
        .or(`anggota_id.eq.${member.id},jenis.eq.sistem,jenis.eq.pengumuman`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Data Context: Error fetching notifications:', error);
        setState(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            isLoading: false,
            error: error as Error,
          }
        }));
        return;
      }
      
      // If we successfully fetched data (even if empty), process it
      const notificationsData = data || [];

      console.log('Data Context: Successfully fetched notifications, count:', notificationsData?.length || 0);
      if (notificationsData?.length > 0) {
        console.log('Data Context: First notification:', JSON.stringify(notificationsData[0], null, 2));
      } else {
        console.log('Data Context: No notifications found for member:', member.id);
      }

      // Count unread notifications
      const unreadCount = notificationsData?.filter((n: Notification) => !n.is_read).length || 0;
      console.log('Data Context: Unread notifications count:', unreadCount);
      
      setState(prev => ({
        ...prev,
        notifications: {
          data: notificationsData || [],
          unreadCount,
          lastFetched: now,
          isLoading: false,
          error: null,
        }
      }));
    } catch (error) {
      console.error('Data Context: Error in notifications fetch:', error);
      setState(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          isLoading: false,
          error: error as Error,
        }
      }));
    }
  }, [isAuthenticated, member]);  // Removed state dependencies to prevent infinite loops

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated || !member) {
      console.log('Data Context: Not authenticated or no member, cannot mark notification as read');
      return false;
    }
    
    console.log(`Data Context: Marking notification ${notificationId} as read for member ${member.id}`);
    
    try {
      // First, verify the notification exists and get its current status
      const { data: checkData, error: checkError } = await supabase
        .from('notifikasi')
        .select('id, is_read, anggota_id, jenis')
        .eq('id', notificationId)
        .single();
      
      if (checkError) {
        console.error('Data Context: Error checking notification before marking as read:', checkError);
        return false;
      }
      
      if (!checkData) {
        console.error(`Data Context: Notification ${notificationId} not found`);
        return false;
      }
      
      console.log(`Data Context: Found notification ${notificationId}, current read status:`, checkData.is_read);
      
      // If already read, no need to update
      if (checkData.is_read) {
        console.log(`Data Context: Notification ${notificationId} is already marked as read`);
        return true;
      }
      
      // Check if this is the user's notification or a system notification
      const isUserNotification = checkData.anggota_id === member.id;
      const isSystemNotification = checkData.jenis === 'sistem' || checkData.jenis === 'pengumuman';
      
      if (!isUserNotification && !isSystemNotification) {
        console.error(`Data Context: User ${member.id} does not have permission to mark notification ${notificationId} as read`);
        return false;
      }
      
      // Update the notification in Supabase
      const { error } = await supabase
        .from('notifikasi')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Data Context: Error marking notification as read in Supabase:', error);
        return false;
      }
      
      console.log(`Data Context: Successfully marked notification ${notificationId} as read in Supabase`);
      
      // Update local state
      setState(prev => {
        const updatedNotifications = prev.notifications.data.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        
        const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
        
        return {
          ...prev,
          notifications: {
            ...prev.notifications,
            data: updatedNotifications,
            unreadCount,
          }
        };
      });
      
      return true;
    } catch (error) {
      console.error('Data Context: Error marking notification as read:', error);
      return false;
    }
  }, [isAuthenticated, member]);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!isAuthenticated || !member) {
      console.log('Data Context: Not authenticated or no member, cannot mark all notifications as read');
      return false;
    }
    
    console.log(`Data Context: Marking all unread notifications as read for member ${member.id}`);
    
    try {
      // First, check if there are any unread notifications
      const { data: unreadData, error: checkError } = await supabase
        .from('notifikasi')
        .select('id')
        .eq('anggota_id', member.id)
        .eq('is_read', false);
      
      if (checkError) {
        console.error('Data Context: Error checking unread notifications:', checkError);
        return false;
      }
      
      const unreadCount = unreadData?.length || 0;
      console.log(`Data Context: Found ${unreadCount} unread notifications for member ${member.id}`);
      
      if (unreadCount === 0) {
        console.log('Data Context: No unread notifications to mark as read');
        return true; // No need to update anything
      }
      
      // Update all unread notifications in Supabase
      const { error } = await supabase
        .from('notifikasi')
        .update({ is_read: true })
        .eq('anggota_id', member.id)
        .eq('is_read', false);
      
      if (error) {
        console.error('Data Context: Error marking all notifications as read in Supabase:', error);
        return false;
      }
      
      console.log(`Data Context: Successfully marked ${unreadCount} notifications as read in Supabase`);
      
      // Update local state
      setState(prev => {
        // Update all notifications that belong to this member
        const updatedNotifications = prev.notifications.data.map(n => 
          n.anggota_id === member.id ? { ...n, is_read: true } : n
        );
        
        return {
          ...prev,
          notifications: {
            ...prev.notifications,
            data: updatedNotifications,
            unreadCount: 0,
          }
        };
      });
      
      return true;
    } catch (error) {
      console.error('Data Context: Error marking all notifications as read:', error);
      return false;
    }
  }, [isAuthenticated, member]);

  // Clear cache
  const clearCache = useCallback(() => {
    setState(initialState);
  }, []);

  // Data context value
  const contextValue: DataContextType = {
    ...state,
    fetchTransactions,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearCache,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

// Custom hook to use data context
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
