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
        .order('created_at', { ascending: false })
        .limit(5);

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
    if (!isAuthenticated || !member) return;
    
    // Check if cache is valid and we're not forcing a refresh
    const now = Date.now();
    // Get current state values to avoid dependency on state object
    const lastFetched = state.notifications.lastFetched;
    const dataLength = state.notifications.data.length;
    
    const isCacheValid = lastFetched && 
      (now - lastFetched < CACHE_EXPIRATION);
    
    if (isCacheValid && !forceRefresh && dataLength > 0) {
      console.log('Data Context: Using cached notifications data');
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
      console.log('Data Context: Fetching notifications from API');
      const { data, error } = await supabase
        .from('notifikasi')
        .select('*')
        .eq('anggota_id', member.id)
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

      // Count unread notifications
      const unreadCount = data.filter((n: Notification) => !n.is_read).length;
      
      setState(prev => ({
        ...prev,
        notifications: {
          data,
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
    if (!isAuthenticated || !member) return false;
    
    try {
      const { error } = await supabase
        .from('notifikasi')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Data Context: Error marking notification as read:', error);
        return false;
      }
      
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
    if (!isAuthenticated || !member) return false;
    
    try {
      const { error } = await supabase
        .from('notifikasi')
        .update({ is_read: true })
        .eq('anggota_id', member.id)
        .eq('is_read', false);
      
      if (error) {
        console.error('Data Context: Error marking all notifications as read:', error);
        return false;
      }
      
      // Update local state
      setState(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          data: prev.notifications.data.map(n => ({ ...n, is_read: true })),
          unreadCount: 0,
        }
      }));
      
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
