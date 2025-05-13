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
      console.log('Fetching jenis tabungan...');
      const { data, error } = await supabase
        .from('jenis_tabungan')
        .select('*')
        .eq('is_active', true)
        .order('nama');
      
      if (error) {
        console.error('Error fetching jenis tabungan:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} jenis tabungan`);
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
      console.log(`Fetching jenis tabungan with kode: ${kode}`);
      const { data, error } = await supabase
        .from('jenis_tabungan')
        .select('*')
        .eq('kode', kode)
        .single();
      
      if (error) {
        console.error(`Error fetching jenis tabungan with kode ${kode}:`, error);
        return null;
      }
      
      console.log('Successfully fetched jenis tabungan:', data);
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
      console.log(`Fetching tabungan for anggota ID: ${anggotaId}`);
      
      // Try using the tabungan_display_view which has RLS policies configured
      const { data: viewData, error: viewError } = await supabase
        .from('tabungan_display_view')
        .select('*')
        .eq('anggota_id', anggotaId)
        .order('display_order', { ascending: true });
      
      if (viewError) {
        console.error(`Error fetching from tabungan_display_view: ${viewError.message}`);
        
        // Fallback to direct query
        const { data: tabunganData, error: tabunganError } = await supabase
          .from('tabungan')
          .select(`
            *,
            jenis_tabungan:jenis_tabungan_id(*)
          `)
          .eq('anggota_id', anggotaId)
          .eq('status', 'aktif');
        
        if (tabunganError) {
          console.error(`Error fetching tabungan: ${tabunganError.message}`);
          throw tabunganError;
        }
        
        if (!tabunganData || tabunganData.length === 0) {
          console.log('No tabungan found for this anggota');
          return [];
        }
        
        // Calculate progress percentage for each tabungan if it has a target amount
        const processedData = tabunganData.map(item => {
          if (item.target_amount && item.target_amount > 0) {
            const percentage = Math.min(Math.round((item.saldo / item.target_amount) * 100), 100);
            return {
              ...item,
              progress_percentage: percentage
            };
          }
          return item;
        });
        
        console.log(`Successfully fetched ${processedData.length} tabungan records`);
        return processedData as TabunganWithJenis[];
      }
      
      // Transform view data to match TabunganWithJenis format
      const transformedData = viewData.map(item => ({
        id: item.id,
        nomor_rekening: item.nomor_rekening,
        anggota_id: item.anggota_id,
        jenis_tabungan_id: item.jenis_tabungan_id,
        saldo: item.saldo,
        tanggal_buka: item.tanggal_buka,
        tanggal_jatuh_tempo: item.tanggal_jatuh_tempo,
        status: item.status,
        created_at: '', // These fields aren't in the view but are required by the type
        updated_at: '', // These fields aren't in the view but are required by the type
        tanggal_setoran_reguler: item.tanggal_setoran_reguler,
        is_default: item.is_default,
        last_transaction_date: item.last_transaction_date,
        target_amount: item.target_amount,
        progress_percentage: item.progress_percentage || 
          (item.target_amount && item.target_amount > 0 ? 
            Math.min(Math.round((item.saldo / item.target_amount) * 100), 100) : 0),
        jenis_tabungan: {
          id: item.jenis_tabungan_id,
          kode: item.jenis_tabungan_kode,
          nama: item.jenis_tabungan_nama,
          deskripsi: item.jenis_tabungan_deskripsi,
          minimum_setoran: item.minimum_setoran,
          biaya_admin: 0, // Default value
          is_active: true, // Default value
          created_at: '', // Default value
          updated_at: '', // Default value
          is_reguler: item.is_reguler,
          periode_setoran: item.periode_setoran,
          display_order: item.display_order
        }
      }));
      
      console.log(`Successfully fetched ${transformedData.length} tabungan records from view`);
      return transformedData as TabunganWithJenis[];
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
      console.log(`Fetching tabungan with ID: ${tabunganId}`);
      
      // Validate that tabunganId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tabunganId)) {
        console.error(`Invalid tabungan ID format: ${tabunganId}. Expected a UUID.`);
        return null;
      }
      
      // Try using the tabungan_display_view first
      const { data: viewData, error: viewError } = await supabase
        .from('tabungan_display_view')
        .select('*')
        .eq('id', tabunganId)
        .single();
      
      if (viewError) {
        console.error(`Error fetching from tabungan_display_view: ${viewError.message}`);
        
        // Fallback to direct query
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
        
        // Calculate progress percentage if it has a target amount
        let processedData = data;
        if (data && data.target_amount && data.target_amount > 0) {
          const percentage = Math.min(Math.round((data.saldo / data.target_amount) * 100), 100);
          processedData = {
            ...data,
            progress_percentage: percentage
          };
        }
        
        console.log('Successfully fetched tabungan from direct query');
        return processedData as TabunganWithJenis;
      }
      
      // Transform view data to match TabunganWithJenis format
      const transformedData = {
        id: viewData.id,
        nomor_rekening: viewData.nomor_rekening,
        anggota_id: viewData.anggota_id,
        jenis_tabungan_id: viewData.jenis_tabungan_id,
        saldo: viewData.saldo,
        tanggal_buka: viewData.tanggal_buka,
        tanggal_jatuh_tempo: viewData.tanggal_jatuh_tempo,
        status: viewData.status,
        created_at: '', // These fields aren't in the view but are required by the type
        updated_at: '', // These fields aren't in the view but are required by the type
        tanggal_setoran_reguler: viewData.tanggal_setoran_reguler,
        is_default: viewData.is_default,
        last_transaction_date: viewData.last_transaction_date,
        target_amount: viewData.target_amount,
        progress_percentage: viewData.progress_percentage || 
          (viewData.target_amount && viewData.target_amount > 0 ? 
            Math.min(Math.round((viewData.saldo / viewData.target_amount) * 100), 100) : 0),
        jenis_tabungan: {
          id: viewData.jenis_tabungan_id,
          kode: viewData.jenis_tabungan_kode,
          nama: viewData.jenis_tabungan_nama,
          deskripsi: viewData.jenis_tabungan_deskripsi,
          minimum_setoran: viewData.minimum_setoran,
          biaya_admin: 0, // Default value
          is_active: true, // Default value
          created_at: '', // Default value
          updated_at: '', // Default value
          is_reguler: viewData.is_reguler,
          periode_setoran: viewData.periode_setoran,
          display_order: viewData.display_order
        }
      };
      
      console.log('Successfully fetched tabungan from view');
      return transformedData as TabunganWithJenis;
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
