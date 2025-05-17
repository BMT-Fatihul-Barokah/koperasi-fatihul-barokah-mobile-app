import { supabase } from './supabase';
import { Akun, Anggota } from './database.types';
import { Logger } from './logger';

// Cache for balance data to prevent redundant API calls
const balanceCache = new Map<string, { balance: number; timestamp: number }>();

// Cache expiration time (5 minutes)
const BALANCE_CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Database service for handling Supabase queries
 */
export const DatabaseService = {
  /**
   * Check if an account exists with the given name and account number
   */
  async validateAccount(namaLengkap: string, nomorRekening: string): Promise<Anggota | null> {
    try {
      Logger.debug('Database', 'Validating account', { namaLengkap, nomorRekening });
      
      // First try exact match
      const { data, error } = await supabase
        .from('anggota')
        .select('*')
        .eq('nama', namaLengkap)
        .eq('nomor_rekening', nomorRekening)
        .single();
      
      if (!error && data) {
        Logger.debug('Database', 'Found exact match');
        return data as Anggota;
      }
      
      Logger.debug('Database', 'No exact match found, trying case-insensitive search');
      
      // If exact match fails, try case-insensitive search
      const { data: allAnggota, error: listError } = await supabase
        .from('anggota')
        .select('*')
        .eq('is_active', true); // Only get active accounts
      
      if (listError) {
        Logger.error('Database', 'Error fetching all anggota', listError);
        throw new Error('Network request failed');
      }
      
      // Manual case-insensitive matching
      const matchedAnggota = allAnggota.find(
        (anggota) => 
          anggota.nama.toLowerCase() === namaLengkap.toLowerCase() && 
          anggota.nomor_rekening === nomorRekening
      );
      
      if (matchedAnggota) {
        Logger.debug('Database', 'Found case-insensitive match');
      } else {
        Logger.debug('Database', 'No matching account found');
      }
      
      return matchedAnggota || null;
    } catch (error) {
      Logger.error('Database', 'Error validating account', error);
      throw new Error('Network request failed');
    }
  },

  /**
   * Create or update an account with phone number
   * Returns null if the anggota is already linked to another phone number
   */
  async createOrUpdateAccount(anggotaId: string, nomorTelepon: string): Promise<Akun | null> {
    try {
      Logger.debug('Database', 'Creating/updating account', { anggotaId, nomorTelepon });
      
      // First check if account already exists for this anggota
      const { data: existingAccountForAnggota, error: fetchAnggotaError } = await supabase
        .from('akun')
        .select('*')
        .eq('anggota_id', anggotaId)
        .single();
      
      if (fetchAnggotaError && fetchAnggotaError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        Logger.error('Database', 'Error fetching account for anggota', fetchAnggotaError);
        throw new Error('Failed to fetch account');
      }
      
      // If anggota already has an account with a different phone number, return null
      if (existingAccountForAnggota && existingAccountForAnggota.nomor_telepon !== nomorTelepon) {
        Logger.warn('Database', 'Anggota already linked to another phone number', { 
          anggotaId, 
          existingPhone: existingAccountForAnggota.nomor_telepon 
        });
        return null;
      }
      
      // Check if phone number is already linked to another anggota
      const { data: existingAccountForPhone, error: fetchPhoneError } = await supabase
        .from('akun')
        .select('*')
        .eq('nomor_telepon', nomorTelepon)
        .single();
      
      if (fetchPhoneError && fetchPhoneError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        Logger.error('Database', 'Error fetching account for phone', fetchPhoneError);
        throw new Error('Failed to fetch account');
      }
      
      // If phone number is already linked to another anggota, return null
      if (existingAccountForPhone && existingAccountForPhone.anggota_id !== anggotaId) {
        Logger.warn('Database', 'Phone number already linked to another anggota', { 
          nomorTelepon, 
          existingAnggotaId: existingAccountForPhone.anggota_id 
        });
        return null;
      }
      
      // If anggota already has an account with this phone number, update it
      if (existingAccountForAnggota) {
        Logger.debug('Database', 'Found existing account, updating', { accountId: existingAccountForAnggota.id });
        // Update existing account with new phone number
        const { data, error } = await supabase
          .from('akun')
          .update({ nomor_telepon: nomorTelepon, updated_at: new Date().toISOString() })
          .eq('id', existingAccountForAnggota.id)
          .select()
          .single();
        
        if (error) {
          Logger.error('Database', 'Error updating account', error);
          throw new Error('Failed to update account');
        }
        
        return data as Akun;
      } else {
        Logger.debug('Database', 'No existing account found, creating new account');
        // Create new account
        const { data, error } = await supabase
          .from('akun')
          .insert({ 
            anggota_id: anggotaId, 
            nomor_telepon: nomorTelepon,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          Logger.error('Database', 'Error creating account', error);
          throw new Error('Failed to create account');
        }
        
        return data as Akun;
      }
    } catch (error) {
      Logger.error('Database', 'Error in createOrUpdateAccount', error);
      throw error;
    }
  },

  /**
   * Set PIN for an account
   */
  async setAccountPin(accountId: string, pin: string): Promise<boolean> {
    try {
      Logger.debug('Database', 'Setting account PIN', { accountId });
      
      const { error } = await supabase
        .from('akun')
        .update({ pin, updated_at: new Date().toISOString() })
        .eq('id', accountId);
      
      if (error) {
        Logger.error('Database', 'Error setting PIN', error);
        return false;
      }
      
      Logger.debug('Database', 'PIN set successfully', { accountId });
      return true;
    } catch (error) {
      Logger.error('Database', 'Error in setAccountPin', error);
      return false;
    }
  },

  /**
   * Get account balance with caching to reduce API calls
   */
  async getAccountBalance(anggotaId: string): Promise<number> {
    try {
      // Check if we have a valid cached balance
      const now = Date.now();
      const cachedData = balanceCache.get(anggotaId);
      
      if (cachedData && (now - cachedData.timestamp < BALANCE_CACHE_EXPIRATION)) {
        Logger.debug('Database', 'Using cached balance', { anggotaId, balance: cachedData.balance });
        return cachedData.balance;
      }
      
      Logger.debug('Database', 'Fetching balance', { anggotaId });
      
      // First try to get balance from the tabungan_display_view which has aggregated balances
      const { data: viewData, error: viewError } = await supabase
        .from('tabungan_display_view')
        .select('saldo')
        .eq('anggota_id', anggotaId);
      
      // If view query succeeds, calculate total from view data
      if (!viewError && viewData && viewData.length > 0) {
        const totalBalance = viewData.reduce((sum, account) => sum + (account.saldo || 0), 0);
        
        // Cache the result
        balanceCache.set(anggotaId, { balance: totalBalance, timestamp: now });
        
        Logger.debug('Database', 'Balance calculated from view', { anggotaId, balance: totalBalance, accountCount: viewData.length });
        return totalBalance;
      }
      
      // Fallback to direct query if view doesn't work
      if (viewError) {
        Logger.debug('Database', 'Falling back to direct query for balance', { error: viewError.message });
      }
      
      // Get total balance from all tabungan accounts for this anggota
      const { data, error } = await supabase
        .from('tabungan')
        .select('saldo')
        .eq('anggota_id', anggotaId)
        .eq('status', 'aktif');
      
      if (error) {
        Logger.error('Database', 'Error getting balance', error);
        return 0;
      }
      
      if (!data || data.length === 0) {
        // Don't log this as error, it's a normal condition for new users
        Logger.debug('Database', 'No active tabungan found', { anggotaId });
        
        // Cache the zero balance to prevent repeated lookups
        balanceCache.set(anggotaId, { balance: 0, timestamp: now });
        return 0;
      }
      
      // Calculate total balance from all tabungan accounts
      const totalBalance = data.reduce((sum, account) => sum + (account.saldo || 0), 0);
      
      // Cache the result
      balanceCache.set(anggotaId, { balance: totalBalance, timestamp: now });
      
      Logger.debug('Database', 'Balance calculated', { anggotaId, balance: totalBalance, accountCount: data.length });
      return totalBalance;
    } catch (error) {
      Logger.error('Database', 'Error in getAccountBalance', error);
      return 0;
    }
  },

  /**
   * Get account details with anggota information and balance
   * Uses a single method to fetch all required data to reduce API calls
   */
  async getAccountDetails(accountId: string): Promise<{ account: Akun; member: Anggota; balance: number } | null> {
    try {
      Logger.debug('Database', 'Fetching account details', { accountId });
      
      // Try to get account and member data in a single query using join
      const { data: accountWithMember, error: joinError } = await supabase
        .from('akun')
        .select(`
          *,
          anggota:anggota_id(*)
        `)
        .eq('id', accountId)
        .single();
      
      if (joinError) {
        Logger.error('Database', 'Error getting account with member data', joinError);
        
        // Fallback to separate queries if join fails
        // Get account data
        const { data: account, error: accountError } = await supabase
          .from('akun')
          .select('*')
          .eq('id', accountId)
          .single();
        
        if (accountError) {
          Logger.error('Database', 'Error getting account', accountError);
          return null;
        }
        
        if (!account) {
          Logger.warn('Database', 'Account not found', { accountId });
          return null;
        }
        
        // Get member data
        const { data: member, error: memberError } = await supabase
          .from('anggota')
          .select('*')
          .eq('id', account.anggota_id)
          .single();
        
        if (memberError) {
          Logger.error('Database', 'Error getting member', memberError);
          return null;
        }
        
        if (!member) {
          Logger.warn('Database', 'Member not found', { anggotaId: account.anggota_id });
          return null;
        }
        
        // Get balance data
        const balance = await this.getAccountBalance(member.id);
        
        return {
          account: account as Akun,
          member: member as Anggota,
          balance
        };
      }
      
      if (!accountWithMember || !accountWithMember.anggota) {
        Logger.warn('Database', 'Account or member not found', { accountId });
        return null;
      }
      
      // Extract account and member from the joined result
      const account = { ...accountWithMember };
      delete account.anggota;
      
      const member = accountWithMember.anggota;
      
      // Get balance data
      const balance = await this.getAccountBalance(member.id);
      
      return {
        account: account as Akun,
        member: member as Anggota,
        balance
      };
    } catch (error) {
      Logger.error('Database', 'Error in getAccountDetails', error);
      return null;
    }
  }
};
