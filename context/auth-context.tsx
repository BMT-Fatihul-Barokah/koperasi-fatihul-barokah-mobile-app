import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Define auth state interface
interface AuthState {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  error: Error | null;
}

// Define auth context interface
interface AuthContextType extends AuthState {
  signIn: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Initial auth state
const initialState: AuthState = {
  isLoading: true,
  session: null,
  user: null,
  error: null,
};

// Auth reducer actions
type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; session: Session | null }
  | { type: 'AUTH_ERROR'; error: Error }
  | { type: 'AUTH_SIGN_OUT' };

// Auth reducer function
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        session: action.session,
        user: action.session?.user || null,
        error: null,
      };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, error: action.error };
    case 'AUTH_SIGN_OUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        dispatch({ type: 'AUTH_SUCCESS', session: data.session });
      } catch (error) {
        dispatch({ type: 'AUTH_ERROR', error: error as Error });
      }
    };

    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        dispatch({ type: 'AUTH_SUCCESS', session });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with phone number
  const signIn = async (phone: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error as Error });
      throw error;
    }
  };

  // Verify OTP token
  const verifyOtp = async (phone: string, token: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'phone_change',
      });
      
      if (error) {
        throw error;
      }
      
      dispatch({ type: 'AUTH_SUCCESS', session: data.session });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error as Error });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      dispatch({ type: 'AUTH_SIGN_OUT' });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error as Error });
      throw error;
    }
  };

  // Auth context value
  const value = {
    ...state,
    signIn,
    verifyOtp,
    signOut,
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
