import { supabase } from '../lib/supabase';

export interface Pinjaman {
  id: string;
  anggota_id: string;
  jenis_pinjaman: string;
  status: string;
  jumlah: number;
  jatuh_tempo: string;
  total_pembayaran: number;
  sisa_pembayaran: number;
  created_at: string;
  updated_at: string;
}

export const PINJAMAN_STATUS = {
  diajukan: { label: 'Diajukan', color: '#FFC107' },
  disetujui: { label: 'Disetujui', color: '#2196F3' },
  ditolak: { label: 'Ditolak', color: '#F44336' },
  aktif: { label: 'Aktif', color: '#4CAF50' },
  lunas: { label: 'Lunas', color: '#9E9E9E' },
};

export const PinjamanService = {
  /**
   * Get all loans for a member
   */
  async getPinjamanByAnggota(anggotaId: string): Promise<Pinjaman[]> {
    try {
      console.log(`Fetching pinjaman for anggota ID: ${anggotaId}`);
      
      const { data, error } = await supabase
        .from('pinjaman')
        .select('*')
        .eq('anggota_id', anggotaId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching pinjaman: ${error.message}`);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} pinjaman records`);
      return data as Pinjaman[];
    } catch (error) {
      console.error('Error in getPinjamanByAnggota:', error);
      throw error;
    }
  },

  /**
   * Get a specific loan by ID
   */
  async getPinjamanById(pinjamanId: string): Promise<Pinjaman | null> {
    try {
      console.log(`Fetching pinjaman with ID: ${pinjamanId}`);
      
      // Validate that pinjamanId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(pinjamanId)) {
        console.error(`Invalid pinjaman ID format: ${pinjamanId}. Expected a UUID.`);
        return null;
      }
      
      const { data, error } = await supabase
        .from('pinjaman')
        .select('*')
        .eq('id', pinjamanId)
        .single();
      
      if (error) {
        console.error(`Error fetching pinjaman with ID ${pinjamanId}:`, error);
        return null;
      }
      
      console.log('Successfully fetched pinjaman details');
      return data as Pinjaman;
    } catch (error) {
      console.error('Error in getPinjamanById:', error);
      return null;
    }
  },

  /**
   * Get loan history for a member
   */
  async getPinjamanHistory(anggotaId: string): Promise<Pinjaman[]> {
    try {
      console.log(`Fetching pinjaman history for anggota ID: ${anggotaId}`);
      
      const { data, error } = await supabase
        .from('pinjaman')
        .select('*')
        .eq('anggota_id', anggotaId)
        .in('status', ['lunas', 'ditolak'])
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching pinjaman history: ${error.message}`);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} pinjaman history records`);
      return data as Pinjaman[];
    } catch (error) {
      console.error('Error in getPinjamanHistory:', error);
      throw error;
    }
  },

  /**
   * Calculate progress percentage for a loan
   */
  calculateProgress(pinjaman: Pinjaman): number {
    if (pinjaman.status === 'lunas') return 100;
    if (pinjaman.total_pembayaran === 0) return 0;
    
    const paid = pinjaman.total_pembayaran - pinjaman.sisa_pembayaran;
    return Math.round((paid / pinjaman.total_pembayaran) * 100);
  },

  /**
   * Get formatted status label
   */
  getStatusLabel(status: string): string {
    return PINJAMAN_STATUS[status]?.label || status;
  },

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    return PINJAMAN_STATUS[status]?.color || '#999999';
  }
};
