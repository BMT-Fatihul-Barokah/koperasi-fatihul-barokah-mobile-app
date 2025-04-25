import React, { createContext, useContext, useState, useEffect } from 'react';
import { Akun, Anggota } from '../lib/database.types';
import { DatabaseService } from '../lib/database.service';
import { router } from 'expo-router';
import { storage } from '../lib/storage';

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
        const accountId = await storage.getItem(AUTH_STORAGE_KEY);
        
        if (accountId) {
          const success = await login(accountId);
          if (!success) {
            await storage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error loading auth session:', error);
        setState(prev => ({ ...prev, error: error as Error }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadSession();
  }, []);

  const login = async (accountId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const accountDetails = await DatabaseService.getAccountDetails(accountId);
      
      if (!accountDetails) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          isAuthenticated: false,
          error: new Error('Account not found')
        }));
        return false;
      }
      
      // Store account ID in secure storage
      await storage.setItem(AUTH_STORAGE_KEY, accountId);
      
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
      console.error('Error during login:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error as Error 
      }));
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
      console.error('Error during logout:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error as Error 
      }));
    }
  };

  const refreshUserData = async () => {
    if (!state.account?.id) {
      console.log('Auth: Cannot refresh user data - no account ID');
      return;
    }
    
    console.log(`Auth: Refreshing user data for account ID: ${state.account.id}`);
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const accountDetails = await DatabaseService.getAccountDetails(state.account.id);
      
      if (!accountDetails) {
        console.error('Auth: Failed to get account details');
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: new Error('Failed to refresh account data')
        }));
        return;
      }
      
      console.log('Auth: Account details retrieved successfully:', {
        accountId: accountDetails.account.id,
        memberId: accountDetails.member.id,
        memberName: accountDetails.member.nama,
        balance: accountDetails.balance
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
      console.error('Auth: Error refreshing user data:', error);
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
