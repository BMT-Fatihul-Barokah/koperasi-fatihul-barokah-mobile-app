import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackHeader } from '../../../components/header/back-header';

interface FormData {
  nama: string;
  alamat: string;
  kotaKabupaten: string;
  tempatLahir: string;
  tanggalLahir: string;
  pekerjaan: string;
  jenisIdentitas: 'KTP' | 'SIM' | 'PASPOR';
  noIdentitas: string;
  noTelepon: string;
  sifatAnggota: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
}

export default function NewAccountScreen() {
  const [formData, setFormData] = useState<FormData>({
    nama: '',
    alamat: '',
    kotaKabupaten: '',
    tempatLahir: '',
    tanggalLahir: '',
    pekerjaan: '',
    jenisIdentitas: 'KTP',
    noIdentitas: '',
    noTelepon: '',
    sifatAnggota: '',
    jenisKelamin: 'Laki-laki'
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIdentityTypeSelect = (type: 'KTP' | 'SIM' | 'PASPOR') => {
    setFormData(prev => ({ ...prev, jenisIdentitas: type }));
  };

  const handleGenderSelect = (gender: 'Laki-laki' | 'Perempuan') => {
    setFormData(prev => ({ ...prev, jenisKelamin: gender }));
  };

  const handleSubmit = () => {
    // Validasi form
    if (!formData.nama || !formData.alamat || !formData.kotaKabupaten || 
        !formData.tempatLahir || !formData.tanggalLahir || !formData.pekerjaan || 
        !formData.noIdentitas || !formData.noTelepon) {
      Alert.alert('Error', 'Mohon lengkapi semua data yang diperlukan');
      return;
    }

    // Di sini nantinya akan terhubung ke Supabase
    console.log('Data anggota yang akan dikirim:', formData);
    
    // Untuk sementara, tampilkan pesan sukses dan navigasi ke halaman submission
    Alert.alert('Sukses', 'Data berhasil disimpan', [
      { text: 'OK', onPress: () => router.push('/onboarding/new-account/submission') }
    ]);
  };

  return (
    <SafeAreaProvider>
      <BackHeader title="Pendaftaran Anggota Baru" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Formulir Pendaftaran Anggota Baru</Text>
          <Text style={styles.subtitle}>
            Silakan lengkapi data diri Anda untuk menjadi anggota Koperasi Fatihul Barokah
          </Text>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>DATA ANGGOTA/CALON ANGGOTA</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nama <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama lengkap"
                value={formData.nama}
                onChangeText={(value) => handleChange('nama', value)}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Alamat <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Masukkan alamat lengkap"
                value={formData.alamat}
                onChangeText={(value) => handleChange('alamat', value)}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kota/Kabupaten <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan kota/kabupaten"
                value={formData.kotaKabupaten}
                onChangeText={(value) => handleChange('kotaKabupaten', value)}
              />
            </View>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Tempat Lahir <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kota kelahiran"
                  value={formData.tempatLahir}
                  onChangeText={(value) => handleChange('tempatLahir', value)}
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Tanggal Lahir <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  value={formData.tanggalLahir}
                  onChangeText={(value) => handleChange('tanggalLahir', value)}
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Pekerjaan <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan pekerjaan"
                value={formData.pekerjaan}
                onChangeText={(value) => handleChange('pekerjaan', value)}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Identitas <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.optionContainer}>
                <TouchableOpacity 
                  style={[styles.optionButton, formData.jenisIdentitas === 'KTP' && styles.optionButtonSelected]}
                  onPress={() => handleIdentityTypeSelect('KTP')}
                >
                  <Text style={[styles.optionText, formData.jenisIdentitas === 'KTP' && styles.optionTextSelected]}>KTP</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionButton, formData.jenisIdentitas === 'SIM' && styles.optionButtonSelected]}
                  onPress={() => handleIdentityTypeSelect('SIM')}
                >
                  <Text style={[styles.optionText, formData.jenisIdentitas === 'SIM' && styles.optionTextSelected]}>SIM</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionButton, formData.jenisIdentitas === 'PASPOR' && styles.optionButtonSelected]}
                  onPress={() => handleIdentityTypeSelect('PASPOR')}
                >
                  <Text style={[styles.optionText, formData.jenisIdentitas === 'PASPOR' && styles.optionTextSelected]}>PASPOR</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>No. Identitas <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nomor identitas"
                value={formData.noIdentitas}
                onChangeText={(value) => handleChange('noIdentitas', value)}
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>No. Telepon <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 08123456789"
                value={formData.noTelepon}
                onChangeText={(value) => handleChange('noTelepon', value)}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sifat Anggota <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan sifat anggota"
                value={formData.sifatAnggota}
                onChangeText={(value) => handleChange('sifatAnggota', value)}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Jenis Kelamin <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.optionContainer}>
                <TouchableOpacity 
                  style={[styles.optionButton, formData.jenisKelamin === 'Laki-laki' && styles.optionButtonSelected]}
                  onPress={() => handleGenderSelect('Laki-laki')}
                >
                  <Text style={[styles.optionText, formData.jenisKelamin === 'Laki-laki' && styles.optionTextSelected]}>Laki-laki</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionButton, formData.jenisKelamin === 'Perempuan' && styles.optionButtonSelected]}
                  onPress={() => handleGenderSelect('Perempuan')}
                >
                  <Text style={[styles.optionText, formData.jenisKelamin === 'Perempuan' && styles.optionTextSelected]}>Perempuan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              • Pastikan data yang diisi sudah benar dan sesuai dengan identitas resmi Anda
            </Text>
            <Text style={styles.infoText}>
              • Anda akan diminta untuk melakukan verifikasi data di kantor kami
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Kirim Pendaftaran</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007BFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007BFF',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  requiredStar: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  optionButtonSelected: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  optionText: {
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#007BFF',
    marginBottom: 5,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
