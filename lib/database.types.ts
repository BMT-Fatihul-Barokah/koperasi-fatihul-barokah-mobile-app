export interface Anggota {
  id: string;
  nama: string; // Changed from nama_lengkap to match database schema
  nomor_rekening: string;
  saldo: number;
  alamat?: string;
  kota?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  pekerjaan?: string;
  jenis_identitas?: string;
  nomor_identitas?: string;
  created_at: string;
  updated_at?: string;
  closed_at?: string;
  is_active: boolean;
}

export interface Akun {
  id: string;
  anggota_id: string;
  nomor_telepon: string;
  pin?: string;
  created_at: string;
  updated_at?: string;
}

export interface Saldo {
  id: string;
  anggota_id: string;
  jumlah: number;
  created_at: string;
  updated_at?: string;
}

export interface JenisTabungan {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
  bagi_hasil?: number;
  minimum_setoran: number;
  biaya_admin: number;
  jangka_waktu?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_required?: boolean;
  is_reguler?: boolean;
  periode_setoran?: string;
  denda_keterlambatan?: number;
  display_order?: number;
}

export interface Tabungan {
  id: string;
  nomor_rekening: string;
  anggota_id: string;
  jenis_tabungan_id: string;
  saldo: number;
  tanggal_buka: string;
  tanggal_jatuh_tempo?: string;
  status: 'aktif' | 'tidak_aktif' | 'ditutup';
  created_at: string;
  updated_at: string;
  tanggal_setoran_reguler?: number;
  is_default?: boolean;
  last_transaction_date?: string;
  target_amount?: number;
  progress_percentage?: number;
}

export interface TabunganWithJenis extends Tabungan {
  jenis_tabungan: JenisTabungan;
  anggota_nama?: string;
  jenis_tabungan_kode?: string;
  jenis_tabungan_nama?: string;
  jenis_tabungan_deskripsi?: string;
}

export interface Database {
  anggota: Anggota;
  akun: Akun;
  saldo: Saldo;
  jenis_tabungan: JenisTabungan;
  tabungan: Tabungan;
}
