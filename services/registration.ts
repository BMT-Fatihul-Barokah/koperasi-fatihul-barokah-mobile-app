// This file is deprecated and should be removed
// Registration flow has been removed from the application

import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';

export interface RegistrationFormData {
  nama: string;
  alamat: string;
  kotaKabupaten: string;
  tempatLahir: string;
  tanggalLahir: string;
  pekerjaan: string;
  jenisIdentitas: 'KTP' | 'SIM' | 'PASPOR';
  noIdentitas: string;
  noTelepon: string; // This will be overridden with the verified phone number
  sifatAnggota: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  submissionId?: string;
  error?: any;
}

/**
 * Creates a new registration entry in Supabase
 * @param formData Registration form data
 * @returns Response with success status and submission ID
 */
export async function registerNewMember(formData: RegistrationFormData): Promise<RegistrationResponse> {
  try {
    // Generate a random submission ID
    const submissionId = `REG-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Get the verified phone number from storage (set during phone verification)
    let verifiedPhoneNumber = await storage.getItem('temp_phone_number');
    
    if (!verifiedPhoneNumber) {
      console.error('No verified phone number found in storage');
      return {
        success: false,
        message: 'Nomor telepon belum diverifikasi. Silakan kembali ke halaman verifikasi nomor telepon.',
        error: new Error('No verified phone number')
      };
    }
    
    console.log('Using verified phone number:', verifiedPhoneNumber);
    
    // First, create an account entry with the verified phone number
    const { data: accountData, error: accountError } = await supabase
      .from('akun')
      .insert({
        nomor_telepon: verifiedPhoneNumber,
        is_verified: true, // Phone has been verified
        is_active: false, // Will be activated by admin later
      })
      .select('id')
      .single();
    
    if (accountError) {
      console.error('Error creating account:', accountError);
      return {
        success: false,
        message: 'Gagal membuat akun. Nomor telepon mungkin sudah terdaftar.',
        error: accountError
      };
    }
    
    // Format date from DD/MM/YYYY to YYYY-MM-DD for database
    const [day, month, year] = formData.tanggalLahir.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    
    // Then create a registration entry linked to the account
    const { error: registrationError } = await supabase
      .from('pendaftaran')
      .insert({
        nama: formData.nama,
        alamat: formData.alamat,
        kotaKabupaten: formData.kotaKabupaten,
        tempatLahir: formData.tempatLahir,
        tanggalLahir: formattedDate,
        pekerjaan: formData.pekerjaan,
        jenisIdentitas: formData.jenisIdentitas,
        noIdentitas: formData.noIdentitas,
        noTelepon: verifiedPhoneNumber, // Use the verified phone number
        sifatAnggota: formData.sifatAnggota,
        jenisKelamin: formData.jenisKelamin,
        status: 'menunggu', // Use 'menunggu' instead of 'pending' to match the constraint
        akun_id: accountData.id,
        submission_id: submissionId
      });
    
    if (registrationError) {
      console.error('Error creating registration:', registrationError);
      
      // Clean up the account if registration fails
      await supabase
        .from('akun')
        .delete()
        .eq('id', accountData.id);
      
      return {
        success: false,
        message: 'Gagal menyimpan data pendaftaran.',
        error: registrationError
      };
    }
    
    return {
      success: true,
      message: 'Pendaftaran berhasil dikirim.',
      submissionId
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat mendaftar.',
      error
    };
  }
}
