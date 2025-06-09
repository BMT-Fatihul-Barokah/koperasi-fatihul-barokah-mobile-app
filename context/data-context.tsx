import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth-context';
import { Anggota } from '../lib/database.types';
import { LoanNotificationService } from '../services/loan-notification.service';
import { Logger, LogCategory } from '../lib/logger';
import { NotificationService, Notification as NotificationType } from '../services/notification.service';

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

// Use the Notification type from the notification service
type Notification = NotificationType;

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

  // In-memory cache for the current session
  const [sessionFlags, setSessionFlags] = useState<Record<string, boolean>>({});

  // Check for loan installments when the app loads - but only once per session
  useEffect(() => {
    if (isAuthenticated && member?.id) {
      // Use a session flag to prevent multiple checks
      const loanCheckKey = `loan_check_${member.id}`;
      
      // Check if we've already done this in the current session
      if (!sessionFlags[loanCheckKey]) {
        Logger.info('Data', 'Checking loan installments', { memberId: member.id });
        
        // Check loan installments for the member
        LoanNotificationService.checkMemberLoanInstallments(member.id)
          .then(() => {
            Logger.debug('Data', 'Loan installment check completed');
            // Set flag to prevent repeated checks in this session
            setSessionFlags(prev => ({
              ...prev,
              [loanCheckKey]: true
            }));
            // Refresh notifications after checking loan installments
            fetchNotifications(true);
          })
          .catch(error => {
            Logger.error('Data', 'Error checking loan installments', error);
          });
      }
    }
  }, [isAuthenticated, member?.id, sessionFlags]);

  // Fetch transactions
  const fetchTransactions = useCallback(async (forceRefresh = false) => {
    // If not authenticated or no member, return
    if (!isAuthenticated || !member) {
      Logger.debug('Data', 'Not authenticated or no member, skipping transaction fetch');
      return;
    }
    
    // Check if cache is valid and we're not forcing a refresh
    const now = Date.now();
    const lastFetched = state.transactions.lastFetched;
    const dataLength = state.transactions.data.length;
    
    const isCacheValid = lastFetched && 
      (now - lastFetched < CACHE_EXPIRATION);
    
    if (isCacheValid && !forceRefresh && dataLength > 0) {
      Logger.debug('Data', 'Using cached transactions data', { count: dataLength });
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
      Logger.info('Data', 'Fetching transactions', { memberId: member.id });
      const { data, error } = await supabase
        .from('transaksi')
        .select('*')
        .eq('anggota_id', member.id)
        .order('created_at', { ascending: false });

      if (error) {
        Logger.error('Data', 'Error fetching transactions', error);
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
      Logger.error('Data', 'Error in transaction fetch', error);
      setState(prev => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          isLoading: false,
          error: error as Error,
        }
      }));
    }
  }, [isAuthenticated, member]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (forceRefresh = false) => {
    // If not authenticated or no member, return
    if (!isAuthenticated || !member) {
      Logger.debug(LogCategory.NOTIFICATIONS, 'Not authenticated or no member, skipping notifications fetch');
      return;
    }
    
    // Check if cache is valid and we're not forcing a refresh
    const now = Date.now();
    const lastFetched = state.notifications.lastFetched;
    const dataLength = state.notifications.data.length;
    
    const isCacheValid = lastFetched && 
                        (now - lastFetched < CACHE_EXPIRATION) && 
                        dataLength > 0;
                        
    if (isCacheValid && !forceRefresh) {
      Logger.debug(LogCategory.NOTIFICATIONS, 'Using cached notifications data');
      return;
    }
    
    Logger.info(LogCategory.NOTIFICATIONS, 'Fetching notifications', { memberId: member.id });
    
    // Set loading state
    setState(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        isLoading: true,
        error: null,
      }
    }));
    
    try {
      // Use NotificationService to fetch notifications
      const allData = await NotificationService.getNotifications(member.id);
      Logger.debug(LogCategory.NOTIFICATIONS, `Fetched ${allData.length} notifications`);
      
      // Check if we found any jatuh_tempo notifications
      const jatuhTempoFound = allData.some(notification => notification.jenis === 'jatuh_tempo');
      
      if (jatuhTempoFound) {
        Logger.debug(LogCategory.NOTIFICATIONS, `Found jatuh_tempo notifications`);
      } else {
        Logger.debug(LogCategory.NOTIFICATIONS, 'No due date notifications found');
      }
      
      // Sort by created_at
      allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Count notification types for logging
      const typeCount = {};
      allData.forEach(n => {
        typeCount[n.jenis] = (typeCount[n.jenis] || 0) + 1;
      });
      Logger.debug(LogCategory.NOTIFICATIONS, 'Notification summary', { types: typeCount, hasDueDateNotifications: jatuhTempoFound });
      
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
      Logger.error(LogCategory.NOTIFICATIONS, 'Error in notifications fetch', error);
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
  
  // Mark a notification as read
  const markNotificationAsRead = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated || !member) {
      Logger.debug(LogCategory.NOTIFICATIONS, 'Not authenticated or no member, cannot mark notification as read');
      return false;
    }
    
    Logger.info(LogCategory.NOTIFICATIONS, `Marking notification ${id} as read`, { memberId: member.id });
    
    try {
      // Find the notification to get its source
      const notification = state.notifications.data.find(n => n.id === id);
      
      // Use NotificationService to mark notification as read with source field
      const success = await NotificationService.markAsRead(id, notification?.source);
      
      if (!success) {
        Logger.error(LogCategory.NOTIFICATIONS, `Failed to mark notification ${id} as read`);
        return false;
      }
      
      Logger.info(LogCategory.NOTIFICATIONS, `Successfully marked notification ${id} as read`);
      
      // Update local state
      setState(prev => {
        const updatedNotifications = prev.notifications.data.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        );
        
        const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
        
        Logger.debug(LogCategory.NOTIFICATIONS, `Updated local state for notification ${id}`, { unreadCount });
        
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
      Logger.error(LogCategory.NOTIFICATIONS, 'Error in markNotificationAsRead', error);
      return false;
    }
  }, [isAuthenticated, member]);

  // No longer need the updateNotificationDirectly helper function as we're using NotificationService

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !member) {
      Logger.debug(LogCategory.NOTIFICATIONS, 'Not authenticated or no member, cannot mark all notifications as read');
      return false;
    }
    
    Logger.info(LogCategory.NOTIFICATIONS, `Marking all notifications as read`, { memberId: member.id });
    
    try {
      // Use NotificationService to mark all notifications as read
      const success = await NotificationService.markAllAsRead(member.id);
      
      if (!success) {
        Logger.error(LogCategory.NOTIFICATIONS, 'Failed to mark all notifications as read');
        return false;
      }
      
      Logger.info(LogCategory.NOTIFICATIONS, 'Successfully marked all notifications as read');
      
      // Update local state
      setState(prev => {
        const updatedNotifications = prev.notifications.data.map(n => ({
          ...n,
          is_read: true
        }));
        
        Logger.debug(LogCategory.NOTIFICATIONS, 'Updated local state for all notifications');
        
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
      Logger.error(LogCategory.NOTIFICATIONS, 'Error in markAllNotificationsAsRead', error);
      return false;
    }
  }, [isAuthenticated, member]);

  // Clear cache
  const clearCache = useCallback(() => {
    Logger.debug(LogCategory.DATA, 'Clearing data cache');
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
