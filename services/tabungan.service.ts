import { supabase } from '../lib/supabase';
import { JenisTabungan, Tabungan, TabunganWithJenis } from '../lib/database.types';

/**
 * Service for managing savings accounts (tabungan)
 */
export const TabunganService = {
  /**
   * Get all active savings account types
   */
  async getJenisTabungan(): Promise<JenisTabungan[]> {
    try {
      const { data, error } = await supabase
        .from('jenis_tabungan')
        .select('*')
        .eq('is_active', true)
        .order('nama');
      
      if (error) {
        console.error('Error fetching jenis tabungan:', error);
        throw error;
      }
      
      return data as JenisTabungan[];
    } catch (error) {
      console.error('Error in getJenisTabungan:', error);
      throw error;
    }
  },

  /**
   * Get details of a specific savings account type by code
   */
  async getJenisTabunganByKode(kode: string): Promise<JenisTabungan | null> {
    try {
      const { data, error } = await supabase
        .from('jenis_tabungan')
        .select('*')
        .eq('kode', kode)
        .single();
      
      if (error) {
        console.error(`Error fetching jenis tabungan with kode ${kode}:`, error);
        return null;
      }
      
      return data as JenisTabungan;
    } catch (error) {
      console.error('Error in getJenisTabunganByKode:', error);
      return null;
    }
  },

  /**
   * Get all savings accounts for a member
   */
  async getTabunganByAnggota(anggotaId: string): Promise<TabunganWithJenis[]> {
    try {
      const { data, error } = await supabase
        .from('tabungan')
        .select(`
          *,
          jenis_tabungan:jenis_tabungan_id(*)
        `)
        .eq('anggota_id', anggotaId);
      
      if (error) {
        console.error(`Error fetching tabungan for anggota ${anggotaId}:`, error);
        throw error;
      }
      
      return data as TabunganWithJenis[];
    } catch (error) {
      console.error('Error in getTabunganByAnggota:', error);
      throw error;
    }
  },

  /**
   * Get a specific savings account by ID
   */
  async getTabunganById(tabunganId: string): Promise<TabunganWithJenis | null> {
    try {
      const { data, error } = await supabase
        .from('tabungan')
        .select(`
          *,
          jenis_tabungan:jenis_tabungan_id(*)
        `)
        .eq('id', tabunganId)
        .single();
      
      if (error) {
        console.error(`Error fetching tabungan with ID ${tabunganId}:`, error);
        return null;
      }
      
      return data as TabunganWithJenis;
    } catch (error) {
      console.error('Error in getTabunganById:', error);
      return null;
    }
  },

  /**
   * Open a new savings account for a member
   */
  async bukaTabungan(
    anggotaId: string, 
    jenisKode: string, 
    setoranAwal: number = 0,
    tanggalJatuhTempo?: Date
  ): Promise<{ success: boolean; message: string; tabunganId?: string; nomorRekening?: string }> {
    try {
      // Call the buka_tabungan stored procedure
      const { data, error } = await supabase.rpc('buka_tabungan', {
        p_anggota_id: anggotaId,
        p_jenis_kode: jenisKode,
        p_setoran_awal: setoranAwal,
        p_tanggal_jatuh_tempo: tanggalJatuhTempo ? tanggalJatuhTempo.toISOString() : null
      });

      if (error) {
        console.error('Error opening tabungan:', error);
        return {
          success: false,
          message: error.message || 'Gagal membuka rekening tabungan'
        };
      }

      // Get the newly created tabungan
      const { data: newTabungan, error: fetchError } = await supabase
        .from('tabungan')
        .select('*')
        .eq('anggota_id', anggotaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.error('Error fetching new tabungan:', fetchError);
        return {
          success: true,
          message: 'Rekening tabungan berhasil dibuka, tetapi gagal mendapatkan detailnya'
        };
      }

      return {
        success: true,
        message: 'Rekening tabungan berhasil dibuka',
        tabunganId: newTabungan.id,
        nomorRekening: newTabungan.nomor_rekening
      };
    } catch (error) {
      console.error('Error in bukaTabungan:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat membuka rekening tabungan'
      };
    }
  },

  /**
   * Perform a deposit transaction to a savings account
   */
  async setorTabungan(
    tabunganId: string,
    anggotaId: string,
    jumlah: number,
    deskripsi: string = 'Setoran tabungan'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get current balance
      const { data: tabungan, error: fetchError } = await supabase
        .from('tabungan')
        .select('saldo')
        .eq('id', tabunganId)
        .single();

      if (fetchError) {
        console.error('Error fetching tabungan balance:', fetchError);
        return {
          success: false,
          message: 'Gagal mendapatkan saldo tabungan'
        };
      }

      const saldoSebelum = tabungan.saldo;
      const saldoSesudah = saldoSebelum + jumlah;

      // Start a transaction
      const { error: transactionError } = await supabase.rpc('begin_transaction');
      if (transactionError) {
        console.error('Error beginning transaction:', transactionError);
        return {
          success: false,
          message: 'Gagal memulai transaksi'
        };
      }

      try {
        // Update tabungan balance
        const { error: updateError } = await supabase
          .from('tabungan')
          .update({ saldo: saldoSesudah, updated_at: new Date().toISOString() })
          .eq('id', tabunganId);

        if (updateError) {
          throw updateError;
        }

        // Record transaction
        const { error: insertError } = await supabase
          .from('transaksi')
          .insert({
            anggota_id: anggotaId,
            tabungan_id: tabunganId,
            tipe_transaksi: 'masuk',
            kategori: 'setoran',
            deskripsi,
            reference_number: `SETOR-${Date.now()}`,
            jumlah,
            saldo_sebelum: saldoSebelum,
            saldo_sesudah: saldoSesudah
          });

        if (insertError) {
          throw insertError;
        }

        // Commit transaction
        const { error: commitError } = await supabase.rpc('commit_transaction');
        if (commitError) {
          throw commitError;
        }

        return {
          success: true,
          message: 'Setoran berhasil dilakukan'
        };
      } catch (error) {
        // Rollback transaction on error
        await supabase.rpc('rollback_transaction');
        console.error('Error in setorTabungan transaction:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Gagal melakukan setoran'
        };
      }
    } catch (error) {
      console.error('Error in setorTabungan:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat melakukan setoran'
      };
    }
  },

  /**
   * Perform a withdrawal transaction from a savings account
   */
  async tarikTabungan(
    tabunganId: string,
    anggotaId: string,
    jumlah: number,
    deskripsi: string = 'Penarikan tabungan'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get current balance
      const { data: tabungan, error: fetchError } = await supabase
        .from('tabungan')
        .select('saldo')
        .eq('id', tabunganId)
        .single();

      if (fetchError) {
        console.error('Error fetching tabungan balance:', fetchError);
        return {
          success: false,
          message: 'Gagal mendapatkan saldo tabungan'
        };
      }

      const saldoSebelum = tabungan.saldo;
      
      // Check if balance is sufficient
      if (saldoSebelum < jumlah) {
        return {
          success: false,
          message: 'Saldo tidak mencukupi untuk melakukan penarikan'
        };
      }
      
      const saldoSesudah = saldoSebelum - jumlah;

      // Start a transaction
      const { error: transactionError } = await supabase.rpc('begin_transaction');
      if (transactionError) {
        console.error('Error beginning transaction:', transactionError);
        return {
          success: false,
          message: 'Gagal memulai transaksi'
        };
      }

      try {
        // Update tabungan balance
        const { error: updateError } = await supabase
          .from('tabungan')
          .update({ saldo: saldoSesudah, updated_at: new Date().toISOString() })
          .eq('id', tabunganId);

        if (updateError) {
          throw updateError;
        }

        // Record transaction
        const { error: insertError } = await supabase
          .from('transaksi')
          .insert({
            anggota_id: anggotaId,
            tabungan_id: tabunganId,
            tipe_transaksi: 'keluar',
            kategori: 'penarikan',
            deskripsi,
            reference_number: `TARIK-${Date.now()}`,
            jumlah,
            saldo_sebelum: saldoSebelum,
            saldo_sesudah: saldoSesudah
          });

        if (insertError) {
          throw insertError;
        }

        // Commit transaction
        const { error: commitError } = await supabase.rpc('commit_transaction');
        if (commitError) {
          throw commitError;
        }

        return {
          success: true,
          message: 'Penarikan berhasil dilakukan'
        };
      } catch (error) {
        // Rollback transaction on error
        await supabase.rpc('rollback_transaction');
        console.error('Error in tarikTabungan transaction:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Gagal melakukan penarikan'
        };
      }
    } catch (error) {
      console.error('Error in tarikTabungan:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat melakukan penarikan'
      };
    }
  },

  /**
   * Get transaction history for a specific savings account
   */
  async getRiwayatTransaksi(tabunganId: string, limit: number = 10, offset: number = 0): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('transaksi')
        .select('*')
        .eq('tabungan_id', tabunganId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(`Error fetching transaction history for tabungan ${tabunganId}:`, error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRiwayatTransaksi:', error);
      throw error;
    }
  }
};
