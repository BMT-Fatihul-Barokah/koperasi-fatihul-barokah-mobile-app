import { supabase } from './supabase';
import { Akun, Anggota, Saldo } from './database.types';

/**
 * Database service for handling Supabase queries
 */
export const DatabaseService = {
  /**
   * Check if an account exists with the given name and account number
   */
  async validateAccount(namaLengkap: string, nomorRekening: string): Promise<Anggota | null> {
    try {
      console.log(`Validating account with nama: ${namaLengkap}, nomor_rekening: ${nomorRekening}`);
      
      // First try exact match
      const { data, error } = await supabase
        .from('anggota')
        .select('*')
        .eq('nama', namaLengkap) // Changed from nama_lengkap to nama
        .eq('nomor_rekening', nomorRekening)
        .single();
      
      if (!error && data) {
        console.log('Found exact match:', data);
        return data as Anggota;
      }
      
      console.log('No exact match found, trying case-insensitive search');
      
      // If exact match fails, try case-insensitive search
      const { data: allAnggota, error: listError } = await supabase
        .from('anggota')
        .select('*')
        .eq('is_active', true); // Only get active accounts
      
      if (listError) {
        console.error('Error fetching all anggota:', listError);
        throw new Error('Network request failed');
      }
      
      console.log(`Found ${allAnggota.length} total anggota records`);
      
      // Manual case-insensitive matching
      const matchedAnggota = allAnggota.find(
        (anggota) => 
          anggota.nama.toLowerCase() === namaLengkap.toLowerCase() && // Changed from nama_lengkap to nama
          anggota.nomor_rekening === nomorRekening
      );
      
      if (matchedAnggota) {
        console.log('Found case-insensitive match:', matchedAnggota);
      } else {
        console.log('No matching account found');
      }
      
      return matchedAnggota || null;
    } catch (error) {
      console.error('Error validating account:', error);
      throw new Error('Network request failed');
    }
  },

  /**
   * Create or update an account with phone number
   */
  async createOrUpdateAccount(anggotaId: string, nomorTelepon: string): Promise<Akun | null> {
    try {
      console.log(`Creating/updating account for anggota ID: ${anggotaId} with phone: ${nomorTelepon}`);
      
      // First check if account already exists
      const { data: existingAccount, error: fetchError } = await supabase
        .from('akun')
        .select('*')
        .eq('anggota_id', anggotaId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error fetching account:', fetchError);
        throw new Error('Failed to fetch account');
      }
      
      if (existingAccount) {
        console.log('Found existing account, updating...', existingAccount.id);
        // Update existing account with new phone number
        const { data, error } = await supabase
          .from('akun')
          .update({ nomor_telepon: nomorTelepon, updated_at: new Date().toISOString() })
          .eq('id', existingAccount.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating account:', error);
          throw new Error('Failed to update account');
        }
        
        return data as Akun;
      } else {
        console.log('No existing account found, creating new account...');
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
          console.error('Error creating account:', error);
          throw new Error('Failed to create account');
        }
        
        return data as Akun;
      }
    } catch (error) {
      console.error('Error in createOrUpdateAccount:', error);
      throw error;
    }
  },

  /**
   * Set PIN for an account
   */
  async setAccountPin(accountId: string, pin: string): Promise<boolean> {
    const { error } = await supabase
      .from('akun')
      .update({ pin, updated_at: new Date().toISOString() })
      .eq('id', accountId);
    
    if (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
    
    return true;
  },

  /**
   * Get account balance
   */
  async getAccountBalance(anggotaId: string): Promise<number> {
    try {
      console.log(`Fetching balance for anggota ID: ${anggotaId}`);
      
      // Get balance directly from the anggota table
      const { data, error } = await supabase
        .from('anggota')
        .select('saldo')
        .eq('id', anggotaId)
        .single();
      
      if (error) {
        console.error('Error getting balance:', error);
        return 0;
      }
      
      if (!data) {
        console.error('No data found for anggota ID:', anggotaId);
        return 0;
      }
      
      console.log(`Balance found: ${data.saldo}`);
      return data.saldo;
    } catch (error) {
      console.error('Error in getAccountBalance:', error);
      return 0;
    }
  },

  /**
   * Get account details with anggota information
   */
  async getAccountDetails(accountId: string): Promise<{ account: Akun; member: Anggota; balance: number } | null> {
    const { data: account, error: accountError } = await supabase
      .from('akun')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (accountError) {
      console.error('Error getting account:', accountError);
      return null;
    }
    
    const { data: member, error: memberError } = await supabase
      .from('anggota')
      .select('*')
      .eq('id', account.anggota_id)
      .single();
    
    if (memberError) {
      console.error('Error getting member:', memberError);
      return null;
    }
    
    const balance = await this.getAccountBalance(member.id);
    
    return {
      account: account as Akun,
      member: member as Anggota,
      balance
    };
  }
};
