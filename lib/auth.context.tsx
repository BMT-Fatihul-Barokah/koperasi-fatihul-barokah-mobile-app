import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Akun, Anggota } from './database.types';
import { DatabaseService } from './database.service';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  account: Akun | null;
  member: Anggota | null;
  balance: number;
}

interface AuthContextType extends AuthState {
  login: (accountId: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'koperasi_auth_account_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    account: null,
    member: null,
    balance: 0,
  });

  // Check for existing session on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const accountId = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
        
        if (accountId) {
          const success = await login(accountId);
          if (!success) {
            await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error loading auth session:', error);
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadSession();
  }, []);

  const login = async (accountId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const accountDetails = await DatabaseService.getAccountDetails(accountId);
      
      if (!accountDetails) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          isAuthenticated: false 
        }));
        return false;
      }
      
      // Store account ID in secure storage
      await SecureStore.setItemAsync(AUTH_STORAGE_KEY, accountId);
      
      setState({
        isLoading: false,
        isAuthenticated: true,
        account: accountDetails.account,
        member: accountDetails.member,
        balance: accountDetails.balance
      });
      
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
      
      setState({
        isLoading: false,
        isAuthenticated: false,
        account: null,
        member: null,
        balance: 0
      });
      
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const refreshUserData = async () => {
    if (!state.account?.id) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const accountDetails = await DatabaseService.getAccountDetails(state.account.id);
      
      if (!accountDetails) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        account: accountDetails.account,
        member: accountDetails.member,
        balance: accountDetails.balance
      }));
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
