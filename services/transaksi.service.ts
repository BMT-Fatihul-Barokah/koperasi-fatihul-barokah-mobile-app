import { supabase } from '../lib/supabase';
import { NotificationService } from './notification.service';

export interface Transaksi {
  id: string;
  tipe_transaksi: 'masuk' | 'keluar';
  kategori: 'setoran' | 'penarikan' | 'bagi_hasil' | 'bonus' | 'biaya_admin' | 'lainnya';
  deskripsi: string;
  jumlah: number;
  saldo_sebelum: number;
  saldo_sesudah: number;
  anggota_id?: string;
  pembiayaan_id?: string;
  tabungan_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service for handling transactions
 */
export const TransaksiService = {
  /**
   * Get transaction by ID
   */
  async getTransaksiById(transaksiId: string): Promise<Transaksi | null> {
    try {
      console.log(`Fetching transaction with ID: ${transaksiId}`);
      const { data, error } = await supabase
        .from('transaksi')
        .select('*')
        .eq('id', transaksiId)
        .single();
      
      if (error) {
        console.error(`Error fetching transaction: ${error.message}`);
        return null;
      }
      
      return data as Transaksi;
    } catch (error) {
      console.error('Error in getTransaksiById:', error);
      return null;
    }
  },

  /**
   * Get all transactions for a member
   */
  async getTransaksiByAnggota(
    anggotaId: string, 
    limit: number = 10, 
    offset: number = 0,
    tipeTransaksi?: 'masuk' | 'keluar'
  ): Promise<Transaksi[]> {
    try {
      console.log(`Fetching transactions for anggota ID: ${anggotaId}`);
      
      let query = supabase
        .from('transaksi')
        .select('*')
        .eq('anggota_id', anggotaId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (tipeTransaksi) {
        query = query.eq('tipe_transaksi', tipeTransaksi);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error fetching transactions: ${error.message}`);
        return [];
      }
      
      return data as Transaksi[];
    } catch (error) {
      console.error('Error in getTransaksiByAnggota:', error);
      return [];
    }
  },

  /**
   * Create a transaction with notification
   */
  async createTransaksi(transaksi: Omit<Transaksi, 'id' | 'created_at' | 'updated_at'>): Promise<{ 
    success: boolean; 
    message: string; 
    transaksiId?: string 
  }> {
    try {
      console.log('Creating transaction:', transaksi);
      
      // Insert transaction
      const { data, error } = await supabase
        .from('transaksi')
        .insert([{
          ...transaksi,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('id')
        .single();
      
      if (error) {
        console.error(`Error creating transaction: ${error.message}`);
        return {
          success: false,
          message: `Gagal membuat transaksi: ${error.message}`
        };
      }
      
      // The database trigger will automatically create the notification
      // But we can also manually create a notification if needed
      
      return {
        success: true,
        message: 'Transaksi berhasil dibuat',
        transaksiId: data.id
      };
    } catch (error) {
      console.error('Error in createTransaksi:', error);
      return {
        success: false,
        message: `Terjadi kesalahan: ${error}`
      };
    }
  },

  /**
   * Get transaction summary for a member
   */
  async getTransaksiSummary(anggotaId: string): Promise<{
    totalMasuk: number;
    totalKeluar: number;
    transaksiTerakhir?: Transaksi;
  }> {
    try {
      console.log(`Getting transaction summary for anggota ID: ${anggotaId}`);
      
      // Get total incoming transactions
      const { data: dataMasuk, error: errorMasuk } = await supabase
        .from('transaksi')
        .select('jumlah')
        .eq('anggota_id', anggotaId)
        .eq('tipe_transaksi', 'masuk');
      
      if (errorMasuk) {
        console.error(`Error fetching incoming transactions: ${errorMasuk.message}`);
        return { totalMasuk: 0, totalKeluar: 0 };
      }
      
      // Get total outgoing transactions
      const { data: dataKeluar, error: errorKeluar } = await supabase
        .from('transaksi')
        .select('jumlah')
        .eq('anggota_id', anggotaId)
        .eq('tipe_transaksi', 'keluar');
      
      if (errorKeluar) {
        console.error(`Error fetching outgoing transactions: ${errorKeluar.message}`);
        return { totalMasuk: 0, totalKeluar: 0 };
      }
      
      // Get latest transaction
      const { data: dataLatest, error: errorLatest } = await supabase
        .from('transaksi')
        .select('*')
        .eq('anggota_id', anggotaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      const totalMasuk = dataMasuk.reduce((sum, item) => sum + item.jumlah, 0);
      const totalKeluar = dataKeluar.reduce((sum, item) => sum + item.jumlah, 0);
      
      return {
        totalMasuk,
        totalKeluar,
        transaksiTerakhir: errorLatest ? undefined : dataLatest as Transaksi
      };
    } catch (error) {
      console.error('Error in getTransaksiSummary:', error);
      return { totalMasuk: 0, totalKeluar: 0 };
    }
  }
};
