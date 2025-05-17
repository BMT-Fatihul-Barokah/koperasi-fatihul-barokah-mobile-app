import React, { createContext, useContext, useState, useEffect } from 'react';
import { Akun, Anggota } from '../lib/database.types';
import { DatabaseService } from '../lib/database.service';
import { router } from 'expo-router';
import { storage } from '../lib/storage';
import { Logger } from '../lib/logger';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  account: Akun | null;
  member: Anggota | null;
  balance: number;
  error: Error | null;
}

interface AuthContextType extends AuthState {
  login: (accountId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// Initial auth state
const initialState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  account: null,
  member: null,
  balance: 0,
  error: null,
};

const AUTH_STORAGE_KEY = 'koperasi_auth_account_id';

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Check for existing session on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Reset auth state first
        setState({
          ...initialState,
          isLoading: true
        });
        
        Logger.info('Auth', 'Checking for existing session');
        const accountId = await storage.getItem(AUTH_STORAGE_KEY);
        
        if (accountId) {
          Logger.debug('Auth', 'Found stored account ID', { accountId });
          const success = await login(accountId);
          if (!success) {
            Logger.warn('Auth', 'Login failed, removing stored account ID');
            await storage.removeItem(AUTH_STORAGE_KEY);
          }
        } else {
          Logger.debug('Auth', 'No stored account ID found');
        }
      } catch (error) {
        Logger.error('Auth', 'Error loading auth session', error);
        setState(prev => ({ ...prev, error: error as Error }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadSession();
  }, []);

  const login = async (accountId: string): Promise<boolean> => {
    // First, reset the auth state completely
    setState({
      ...initialState,
      isLoading: true
    });
    
    try {
      Logger.info('Auth', 'Attempting to login with account ID', { accountId });
      const accountDetails = await DatabaseService.getAccountDetails(accountId);
      
      if (!accountDetails) {
        Logger.error('Auth', 'Account not found during login');
        setState({
          ...initialState,
          isLoading: false,
          error: new Error('Account not found')
        });
        return false;
      }
      
      Logger.info('Auth', 'Login successful', {
        accountId,
        memberId: accountDetails.member.id,
        memberName: accountDetails.member.nama
      });
      
      // Store account ID in secure storage
      await storage.setItem(AUTH_STORAGE_KEY, accountId);
      
      // Set the auth state with the new user's information
      setState({
        isLoading: false,
        isAuthenticated: true,
        account: accountDetails.account,
        member: accountDetails.member,
        balance: accountDetails.balance,
        error: null
      });
      
      return true;
    } catch (error) {
      Logger.error('Auth', 'Error during login', error);
      setState({
        ...initialState,
        isLoading: false,
        error: error as Error
      });
      return false;
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await storage.removeItem(AUTH_STORAGE_KEY);
      
      setState({
        isLoading: false,
        isAuthenticated: false,
        account: null,
        member: null,
        balance: 0,
        error: null
      });
      
      router.replace('/');
    } catch (error) {
      Logger.error('Auth', 'Error during logout', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error as Error 
      }));
    }
  };

  const refreshUserData = async () => {
    if (!state.account?.id) {
      Logger.debug('Auth', 'Cannot refresh user data - no account ID');
      return;
    }
    
    Logger.debug('Auth', 'Refreshing user data', { accountId: state.account.id });
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const accountDetails = await DatabaseService.getAccountDetails(state.account.id);
      
      if (!accountDetails) {
        Logger.error('Auth', 'Failed to get account details');
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: new Error('Failed to refresh account data')
        }));
        return;
      }
      
      Logger.debug('Auth', 'Account details retrieved successfully', {
        accountId: accountDetails.account.id,
        memberId: accountDetails.member.id,
        memberName: accountDetails.member.nama
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        account: accountDetails.account,
        member: accountDetails.member,
        balance: accountDetails.balance,
        error: null
      }));
    } catch (error) {
      Logger.error('Auth', 'Error refreshing user data', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error as Error 
      }));
    }
  };

  // Auth context value
  const value = {
    ...state,
    login,
    logout,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
