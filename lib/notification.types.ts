export interface Notification {
  id: string;
  anggota_id: string;
  judul: string;
  pesan: string;
  jenis: string;
  is_read: boolean;
  data?: any;
  created_at: string;
  updated_at?: string;
}
