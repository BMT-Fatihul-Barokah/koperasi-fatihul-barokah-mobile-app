import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth-context';
import { Anggota } from '../lib/database.types';
import { LoanNotificationService } from '../services/loan-notification.service';

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

  // Check for loan installments when the app loads
  useEffect(() => {
    if (isAuthenticated && member?.id) {
      // Check loan installments for the member
      LoanNotificationService.checkMemberLoanInstallments(member.id)
        .then(() => {
          console.log('Data Context: Loan installment check completed');
          // Refresh notifications after checking loan installments
          fetchNotifications(true);
        })
        .catch(error => {
          console.error('Data Context: Error checking loan installments:', error);
        });
    }
  }, [isAuthenticated, member?.id]);

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
      
      // COMPLETELY NEW APPROACH: Fetch all notifications in a single query
      // First get general notifications
      console.log('Data Context: Fetching general notifications for member:', member.id);
      const { data: generalData, error: generalError } = await supabase
        .from('notifikasi')
        .select('*')
        .or(`anggota_id.eq.${member.id},jenis.eq.sistem,jenis.eq.pengumuman`)
        .order('created_at', { ascending: false });
        
      if (generalError) {
        console.error('Data Context: Error fetching general notifications:', generalError);
        throw generalError;
      }
      
      // Then use our dedicated SQL function for jatuh_tempo notifications
      console.log('Data Context: Using dedicated SQL function for jatuh_tempo notifications');
      // Cast the result as any to handle the type mismatch between varchar and text
      const { data: jatuhTempoData, error: jatuhTempoError } = await supabase
        .rpc('get_jatuh_tempo_notifications', { member_id: member.id }) as {
          data: any[] | null;
          error: any;
        };
      
      let allData = generalData || [];
      let jatuhTempoFound = false;
      
      // First try using the RPC function
      if (!jatuhTempoError && jatuhTempoData && jatuhTempoData.length > 0) {
        console.log(`Data Context: Found ${jatuhTempoData.length} jatuh_tempo notifications via RPC function`);
        jatuhTempoFound = true;
        
        // Add jatuh_tempo notifications from RPC function
        jatuhTempoData.forEach(notification => {
          if (!allData.some(n => n.id === notification.id)) {
            allData.push(notification);
          }
        });
      } else {
        // If RPC function failed or returned no results, try direct query
        console.log('Data Context: Falling back to direct query for jatuh_tempo notifications');
        const { data: directJatuhTempoData, error: directJatuhTempoError } = await supabase
          .from('notifikasi')
          .select('*')
          .eq('anggota_id', member.id)
          .eq('jenis', 'jatuh_tempo')
          .order('created_at', { ascending: false });
          
        if (!directJatuhTempoError && directJatuhTempoData && directJatuhTempoData.length > 0) {
          console.log(`Data Context: Found ${directJatuhTempoData.length} jatuh_tempo notifications via direct query`);
          jatuhTempoFound = true;
          
          // Add jatuh_tempo notifications from direct query
          directJatuhTempoData.forEach(notification => {
            if (!allData.some(n => n.id === notification.id)) {
              allData.push(notification);
            }
          });
        } else {
          console.log('Data Context: No jatuh_tempo notifications found via any method');
        }
      }
      
      // Sort by created_at
      allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Count notification types for logging
      const typeCount = {};
      allData.forEach(n => {
        typeCount[n.jenis] = (typeCount[n.jenis] || 0) + 1;
      });
      console.log('Data Context: Notification types after fetch:', typeCount);
      console.log('Data Context: Jatuh tempo notifications found:', jatuhTempoFound);
      
      // Calculate unread count
      const unreadCount = allData.filter(n => !n.is_read).length;
      
      // Update state with the fetched notifications
      setState(prev => ({
        ...prev,
        notifications: {
          data: allData,
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
  }, [isAuthenticated, member]);
  
  // Mark notification as read
  const markNotificationAsRead = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated || !member) {
      console.log('Data Context: Not authenticated or no member, cannot mark notification as read');
      return false;
    }
    
    console.log(`Data Context: Marking notification ${id} as read for member ${member.id}`);
    
    try {
      // First, verify the notification exists and get its current status
      const { data: checkData, error: checkError } = await supabase
        .from('notifikasi')
        .select('id, is_read, anggota_id, jenis')
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error('Data Context: Error checking notification before marking as read:', checkError);
        return false;
      }
      
      if (!checkData) {
        console.error(`Data Context: Notification ${id} not found`);
        return false;
      }
      
      console.log(`Data Context: Found notification ${id}, current read status:`, checkData.is_read);
      
      // If already read, no need to update
      if (checkData.is_read) {
        console.log(`Data Context: Notification ${id} is already marked as read`);
        return true;
      }
      
      // Check if this is the user's notification or a system notification
      const isUserNotification = checkData.anggota_id === member.id;
      const isSystemNotification = checkData.jenis === 'sistem' || checkData.jenis === 'pengumuman';
      
      if (!isUserNotification && !isSystemNotification) {
        console.error(`Data Context: User ${member.id} does not have permission to mark notification ${id} as read`);
        return false;
      }
      
      // Update the notification in Supabase with updated timestamp
      const { error } = await supabase
        .from('notifikasi')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (error) {
        console.error('Data Context: Error marking notification as read in Supabase:', error);
        return false;
      }
      
      console.log(`Data Context: Successfully marked notification ${id} as read in Supabase`);
      
      // Update local state
      setState(prev => {
        const updatedNotifications = prev.notifications.data.map(n => 
          n.id === id ? { ...n, is_read: true } : n
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
