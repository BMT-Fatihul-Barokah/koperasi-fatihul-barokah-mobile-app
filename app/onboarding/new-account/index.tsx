import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, Modal, Pressable, FlatList, Keyboard, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { filterCities } from '../../../lib/data/indonesia-cities';
import { BackHeader } from '../../../components/header/back-header';
import { registerNewMember, RegistrationFormData } from '../../../services/registration';

// Using the RegistrationFormData interface from the registration service

export default function NewAccountScreen() {
  const [formData, setFormData] = useState<RegistrationFormData>({
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // City autocomplete state
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Date picker state
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const dayListRef = useRef<FlatList>(null);
  const monthListRef = useRef<FlatList>(null);
  const yearListRef = useRef<FlatList>(null);

  const handleChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Handle city suggestions when kotaKabupaten field changes
    if (field === 'kotaKabupaten') {
      const suggestions = filterCities(value);
      setCitySuggestions(suggestions);
      setShowCitySuggestions(suggestions.length > 0 && value.length > 0);
    }
  };
  
  const handleCitySelect = (city: string) => {
    handleChange('kotaKabupaten', city);
    // Short delay before hiding suggestions to show the selection highlight
    setTimeout(() => {
      setShowCitySuggestions(false);
      // Remove focus from the input to dismiss keyboard
      Keyboard.dismiss();
    }, 150);
  };

  // Generate arrays for days, months, and years
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateDays = (month: number, year: number) => {
    const daysInMonth = getDaysInMonth(month, year);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => currentYear - i);
  };

  const years = generateYears();
  const days = generateDays(selectedMonth, selectedYear);

  const showDatepicker = () => {
    // Initialize the picker with current selected date or today
    if (formData.tanggalLahir) {
      const [day, month, year] = formData.tanggalLahir.split('/').map(Number);
      setSelectedDay(day);
      setSelectedMonth(month - 1); // Month is 0-indexed in JS Date
      setSelectedYear(year);
      
      // Scroll to the selected values when opening
      setTimeout(() => {
        dayListRef.current?.scrollToIndex({ index: day - 1, animated: false });
        monthListRef.current?.scrollToIndex({ index: month - 1, animated: false });
        const yearIndex = years.findIndex(y => y === year);
        if (yearIndex !== -1) {
          yearListRef.current?.scrollToIndex({ index: yearIndex, animated: false });
        }
      }, 100);
    }
    
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    // Ensure the day is valid for the selected month and year
    const daysInSelectedMonth = getDaysInMonth(selectedMonth, selectedYear);
    const validDay = Math.min(selectedDay, daysInSelectedMonth);
    
    // Format date as DD/MM/YYYY
    const day = String(validDay).padStart(2, '0');
    const month = String(selectedMonth + 1).padStart(2, '0');
    const year = String(selectedYear);
    const formattedDate = `${day}/${month}/${year}`;
    
    handleChange('tanggalLahir', formattedDate);
    setShowDatePicker(false);
  };

  const cancelDateSelection = () => {
    setShowDatePicker(false);
  };

  const handleIdentityTypeSelect = (type: 'KTP' | 'SIM' | 'PASPOR') => {
    setFormData(prev => ({ ...prev, jenisIdentitas: type }));
  };

  const handleGenderSelect = (gender: 'Laki-laki' | 'Perempuan') => {
    setFormData(prev => ({ ...prev, jenisKelamin: gender }));
  };

  const handleSubmit = async () => {
    // Validasi form
    if (!formData.nama || !formData.alamat || !formData.kotaKabupaten || 
        !formData.tempatLahir || !formData.tanggalLahir || !formData.pekerjaan || 
        !formData.noIdentitas || !formData.noTelepon) {
      Alert.alert('Error', 'Mohon lengkapi semua data yang diperlukan');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Submit data to Supabase
      const result = await registerNewMember(formData);
      
      if (result.success) {
        // Store submission ID in router params and navigate to submission page
        router.push({
          pathname: '/onboarding/new-account/submission',
          params: { submissionId: result.submissionId }
        });
      } else {
        Alert.alert('Error', result.message || 'Terjadi kesalahan saat mendaftar');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mendaftar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaProvider>
      <BackHeader title="Pendaftaran Anggota Baru" />
      <KeyboardAwareScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableResetScrollToCoords={false}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 40}
        keyboardOpeningTime={0}
        showsVerticalScrollIndicator={true}>
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
              <View style={styles.autoCompleteContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan kota/kabupaten"
                  value={formData.kotaKabupaten}
                  onChangeText={(value) => handleChange('kotaKabupaten', value)}
                  onFocus={() => {
                    if (formData.kotaKabupaten && citySuggestions.length > 0) {
                      setShowCitySuggestions(true);
                    }
                  }}
                />
                {showCitySuggestions && (
                  <View style={styles.suggestionsContainer}>
                    <FlatList
                      data={citySuggestions}
                      keyExtractor={(item) => item}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                      initialNumToRender={10}
                      maxToRenderPerBatch={20}
                      windowSize={10}
                      contentContainerStyle={styles.suggestionsList}
                      renderItem={({ item }) => {
                        const isSelected = item === formData.kotaKabupaten;
                        return (
                          <TouchableOpacity 
                            style={[styles.suggestionItem, isSelected && styles.suggestionItemSelected]}
                            onPress={() => handleCitySelect(item)}
                            activeOpacity={0.6}
                          >
                            <Text 
                              style={[styles.suggestionText, isSelected && styles.suggestionTextSelected]}
                              numberOfLines={1}
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                )}
              </View>
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
                <TouchableOpacity
                  style={[styles.input, styles.datePickerButton]}
                  onPress={showDatepicker}
                >
                  <Text style={formData.tanggalLahir ? styles.dateText : styles.datePlaceholder}>
                    {formData.tanggalLahir || 'DD/MM/YYYY'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showDatePicker}
                  >
                    <View style={styles.centeredView}>
                      <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Pilih Tanggal Lahir</Text>
                        
                        <View style={styles.datePickerContainer}>
                          {/* Day picker */}
                          <View style={styles.pickerColumn}>
                            <Text style={styles.pickerLabel}>Tanggal</Text>
                            <FlatList
                              ref={dayListRef}
                              data={days}
                              keyExtractor={(item) => item.toString()}
                              showsVerticalScrollIndicator={false}
                              style={styles.pickerList}
                              getItemLayout={(data, index) => ({
                                length: 50,
                                offset: 50 * index,
                                index,
                              })}
                              renderItem={({ item }) => (
                                <TouchableOpacity
                                  style={[styles.pickerItem, selectedDay === item && styles.pickerItemSelected]}
                                  onPress={() => setSelectedDay(item)}
                                >
                                  <Text style={[styles.pickerItemText, selectedDay === item && styles.pickerItemTextSelected]}>
                                    {String(item).padStart(2, '0')}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            />
                          </View>
                          
                          {/* Month picker */}
                          <View style={styles.pickerColumn}>
                            <Text style={styles.pickerLabel}>Bulan</Text>
                            <FlatList
                              ref={monthListRef}
                              data={months}
                              keyExtractor={(item, index) => index.toString()}
                              showsVerticalScrollIndicator={false}
                              style={styles.pickerList}
                              getItemLayout={(data, index) => ({
                                length: 50,
                                offset: 50 * index,
                                index,
                              })}
                              renderItem={({ item, index }) => (
                                <TouchableOpacity
                                  style={[styles.pickerItem, selectedMonth === index && styles.pickerItemSelected]}
                                  onPress={() => {
                                    setSelectedMonth(index);
                                    // Adjust day if needed (e.g., if we select February and day was 30)
                                    const daysInNewMonth = getDaysInMonth(index, selectedYear);
                                    if (selectedDay > daysInNewMonth) {
                                      setSelectedDay(daysInNewMonth);
                                    }
                                  }}
                                >
                                  <Text style={[styles.pickerItemText, selectedMonth === index && styles.pickerItemTextSelected]}>
                                    {item}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            />
                          </View>
                          
                          {/* Year picker */}
                          <View style={styles.pickerColumn}>
                            <Text style={styles.pickerLabel}>Tahun</Text>
                            <FlatList
                              ref={yearListRef}
                              data={years}
                              keyExtractor={(item) => item.toString()}
                              showsVerticalScrollIndicator={false}
                              style={styles.pickerList}
                              getItemLayout={(data, index) => ({
                                length: 50,
                                offset: 50 * index,
                                index,
                              })}
                              renderItem={({ item }) => (
                                <TouchableOpacity
                                  style={[styles.pickerItem, selectedYear === item && styles.pickerItemSelected]}
                                  onPress={() => {
                                    setSelectedYear(item);
                                    // Adjust day if needed (e.g., leap year handling)
                                    const daysInNewMonth = getDaysInMonth(selectedMonth, item);
                                    if (selectedDay > daysInNewMonth) {
                                      setSelectedDay(daysInNewMonth);
                                    }
                                  }}
                                >
                                  <Text style={[styles.pickerItemText, selectedYear === item && styles.pickerItemTextSelected]}>
                                    {item}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            />
                          </View>
                        </View>
                        
                        <View style={styles.modalButtonContainer}>
                          <Pressable
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={cancelDateSelection}
                          >
                            <Text style={styles.cancelButtonText}>Batal</Text>
                          </Pressable>
                          <Pressable
                            style={styles.modalButton}
                            onPress={confirmDate}
                          >
                            <Text style={styles.modalButtonText}>Konfirmasi</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Modal>
                )}
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
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Kirim Pendaftaran</Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
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
    paddingBottom: 80,
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
  datePickerButton: {
    justifyContent: 'center',
  },
  dateText: {
    color: '#000',
  },
  datePlaceholder: {
    color: '#999',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#007BFF',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
    width: '100%',
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  pickerList: {
    height: 150,
    width: '100%',
  },
  pickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#007BFF',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  autoCompleteContainer: {
    position: 'relative',
    zIndex: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  suggestionsList: {
    paddingVertical: 5,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  suggestionItemSelected: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 2,
  },
  suggestionTextSelected: {
    color: '#007BFF',
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
    marginTop: 30,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
});
