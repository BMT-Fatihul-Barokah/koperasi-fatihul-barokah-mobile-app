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

export interface Database {
  anggota: Anggota;
  akun: Akun;
  saldo: Saldo;
}
