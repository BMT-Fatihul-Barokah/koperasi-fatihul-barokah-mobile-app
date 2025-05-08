import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { DatabaseService } from '../lib/database.service';
import { Akun } from '../lib/database.types';

// Storage keys
const PHONE_NUMBER_KEY = 'koperasi_auth_phone_number';
const ACCOUNT_ID_KEY = 'koperasi_auth_account_id';

/**
 * Authentication service for handling phone-based login
 */
export const AuthService = {
  /**
   * Check if a user is already logged in
   */
  async checkExistingSession(): Promise<{ isLoggedIn: boolean; phoneNumber: string | null; accountId: string | null }> {
    try {
      const phoneNumber = await storage.getItem(PHONE_NUMBER_KEY);
      const accountId = await storage.getItem(ACCOUNT_ID_KEY);
      
      return {
        isLoggedIn: !!accountId,
        phoneNumber,
        accountId
      };
    } catch (error) {
      console.error('Error checking existing session:', error);
      return {
        isLoggedIn: false,
        phoneNumber: null,
        accountId: null
      };
    }
  },

  /**
   * Find an account by phone number
   */
  async findAccountByPhone(phoneNumber: string): Promise<Akun | null> {
    try {
      const { data, error } = await supabase
        .from('akun')
        .select('*')
        .eq('nomor_telepon', phoneNumber)
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          console.log(`No account found for phone number: ${phoneNumber}`);
          return null;
        }
        console.error('Error finding account by phone:', error);
        throw new Error('Failed to check account');
      }
      
      return data as Akun;
    } catch (error) {
      console.error('Error in findAccountByPhone:', error);
      throw error;
    }
  },

  /**
   * Verify PIN for an account
   */
  async verifyPin(accountId: string, pin: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('akun')
        .select('pin')
        .eq('id', accountId)
        .single();
      
      if (error) {
        console.error('Error verifying PIN:', error);
        return false;
      }
      
      return data.pin === pin;
    } catch (error) {
      console.error('Error in verifyPin:', error);
      return false;
    }
  },

  /**
   * Login with phone number and PIN
   */
  async loginWithPhone(phoneNumber: string, pin: string): Promise<{ success: boolean; accountId: string | null; message: string }> {
    try {
      // Find account by phone number
      const account = await this.findAccountByPhone(phoneNumber);
      
      if (!account) {
        return {
          success: false,
          accountId: null,
          message: 'Nomor telepon tidak terdaftar'
        };
      }
      
      // Verify PIN
      const isPinValid = await this.verifyPin(account.id, pin);
      
      if (!isPinValid) {
        return {
          success: false,
          accountId: null,
          message: 'PIN tidak valid'
        };
      }
      
      // Store phone number and account ID in secure storage
      await storage.setItem(PHONE_NUMBER_KEY, phoneNumber);
      await storage.setItem(ACCOUNT_ID_KEY, account.id);
      
      return {
        success: true,
        accountId: account.id,
        message: 'Login berhasil'
      };
    } catch (error) {
      console.error('Error in loginWithPhone:', error);
      return {
        success: false,
        accountId: null,
        message: 'Terjadi kesalahan saat login'
      };
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await storage.removeItem(PHONE_NUMBER_KEY);
      await storage.removeItem(ACCOUNT_ID_KEY);
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  }
};
