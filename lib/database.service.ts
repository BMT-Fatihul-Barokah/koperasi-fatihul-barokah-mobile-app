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
    const { data, error } = await supabase
      .from('anggota')
      .select('*')
      .eq('nama_lengkap', namaLengkap)
      .eq('nomor_rekening', nomorRekening)
      .single();
    
    if (error) {
      console.error('Error validating account:', error);
      return null;
    }
    
    return data as Anggota;
  },

  /**
   * Create or update an account with phone number
   */
  async createOrUpdateAccount(anggotaId: string, nomorTelepon: string): Promise<Akun | null> {
    // First check if account already exists
    const { data: existingAccount, error: fetchError } = await supabase
      .from('akun')
      .select('*')
      .eq('anggota_id', anggotaId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching account:', fetchError);
      return null;
    }
    
    if (existingAccount) {
      // Update existing account with new phone number
      const { data, error } = await supabase
        .from('akun')
        .update({ nomor_telepon: nomorTelepon, updated_at: new Date().toISOString() })
        .eq('id', existingAccount.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating account:', error);
        return null;
      }
      
      return data as Akun;
    } else {
      // Create new account
      const { data, error } = await supabase
        .from('akun')
        .insert({ anggota_id: anggotaId, nomor_telepon: nomorTelepon })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating account:', error);
        return null;
      }
      
      return data as Akun;
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
    const { data, error } = await supabase
      .from('saldo')
      .select('jumlah')
      .eq('anggota_id', anggotaId)
      .single();
    
    if (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
    
    return (data as Saldo).jumlah;
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
