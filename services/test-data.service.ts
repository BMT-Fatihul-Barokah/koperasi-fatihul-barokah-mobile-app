import { supabase } from '../lib/supabase';

/**
 * Service for generating test data
 */
export const TestDataService = {
  /**
   * Check and setup database schema
   */
  async checkAndSetupDatabase(): Promise<boolean> {
    try {
      // Check if the notifikasi table exists
      const { data: tableInfo, error: tableError } = await supabase
        .from('notifikasi')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('Error checking notifikasi table:', tableError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking database schema:', error);
      return false;
    }
  },
  
  /**
   * Add test notifications for a member
   */
  async addTestNotifications(anggotaId: string): Promise<boolean> {
    try {
      // First check database
      const dbCheck = await this.checkAndSetupDatabase();
      if (!dbCheck) return false;
      
      // Add test notifications
      const now = new Date().toISOString();
      
      // Create a personal notification for this member
      const personalNotification = {
        anggota_id: anggotaId,
        judul: 'Notifikasi Personal',
        pesan: 'Ini adalah notifikasi personal untuk Anda.',
        jenis: 'info',
        is_read: false,
        created_at: now,
        updated_at: now
      };
      
      // Create a system notification for all users
      const systemNotification = {
        anggota_id: anggotaId,
        judul: 'Pengumuman Sistem',
        pesan: 'Ini adalah pengumuman sistem untuk semua pengguna.',
        jenis: 'sistem',
        is_read: false,
        created_at: now,
        updated_at: now
      };
      
      // Create a transaction notification
      const transactionNotification = {
        anggota_id: anggotaId,
        judul: 'Transaksi Berhasil',
        pesan: 'Transaksi simpanan sebesar Rp 100.000 berhasil dilakukan.',
        jenis: 'transaksi',
        is_read: false,
        data: { transaction_id: 'TX-' + Date.now() },
        created_at: now,
        updated_at: now
      };
      
      // Create a due date notification
      const dueDateNotification = {
        anggota_id: anggotaId,
        judul: 'Pembayaran Jatuh Tempo',
        pesan: 'Anda memiliki pembayaran yang jatuh tempo dalam 3 hari.',
        jenis: 'jatuh_tempo',
        is_read: false,
        data: { loan_id: 'LOAN-' + Date.now() },
        created_at: now,
        updated_at: now
      };
      
      // Create an announcement notification
      const announcementNotification = {
        anggota_id: anggotaId,
        judul: 'Pengumuman Penting',
        pesan: 'Kantor koperasi akan tutup pada tanggal 17 Agustus untuk memperingati Hari Kemerdekaan.',
        jenis: 'pengumuman',
        is_read: false,
        created_at: now,
        updated_at: now
      };
      
      // Insert notifications
      const { error } = await supabase
        .from('notifikasi')
        .insert([
          personalNotification, 
          systemNotification, 
          transactionNotification,
          dueDateNotification,
          announcementNotification
        ]);
      
      if (error) {
        console.error('Error adding test notifications:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error adding test notifications:', error);
      return false;
    }
  }
};
