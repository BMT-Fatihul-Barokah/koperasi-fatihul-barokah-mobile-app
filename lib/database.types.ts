export interface Anggota {
  id: string;
  nama_lengkap: string;
  nomor_rekening: string;
  alamat?: string;
  created_at: string;
  updated_at?: string;
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
