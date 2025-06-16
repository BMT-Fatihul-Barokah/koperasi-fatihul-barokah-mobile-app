import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  useColorScheme,
  useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BackHeader } from '../../components/header/back-header';
import { useAuth } from '../../context/auth-context';
import { useData } from '../../context/data-context';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';
import * as Linking from 'expo-linking';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { clearCache } = useData();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  
  // Create styles with dynamic values based on theme and screen width
  const styles = useMemo(() => createStyles(isDark, width), [isDark, width]);

  // Get app version
  const appVersion = Constants.expoConfig?.version || '0.9.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';
  
  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari aplikasi?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => {
            // Clear data cache before logout
            clearCache();
            logout();
          },
        },
      ]
    );
  };
  
  const handleClearCache = () => {
    Alert.alert(
      'Hapus Cache',
      'Apakah Anda yakin ingin menghapus cache aplikasi? Ini akan menghapus data sementara tetapi tidak akan menghapus data login Anda.',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          onPress: () => {
            clearCache();
            Alert.alert('Berhasil', 'Cache aplikasi berhasil dihapus.');
          },
        },
      ]
    );
  };
  
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@koperasifatihulbarokah.id?subject=Bantuan%20Aplikasi%20Mobile');
  };
  
  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://koperasifatihulbarokah.id/privacy-policy');
  };
  
  const handleOpenTermsOfService = () => {
    Linking.openURL('https://koperasifatihulbarokah.id/terms-of-service');
  };
  
  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    // Here you would implement the actual notification toggle logic
  };
  

  
  const handleToggleAutoSync = (value: boolean) => {
    setAutoSyncEnabled(value);
    // Here you would implement the actual auto sync toggle logic
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <BackHeader 
        title="Pengaturan"
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#0066CC" />
            <Text style={styles.sectionTitle}>Notifikasi</Text>
          </View>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notifikasi Push</Text>
                <Text style={styles.settingDescription}>Terima notifikasi tentang transaksi dan pengumuman</Text>
              </View>
              <Switch
                trackColor={{ false: "#D1D1D6", true: "#007BFF" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D1D6"
                onValueChange={handleToggleNotifications}
                value={notificationsEnabled}
              />
            </View>
          </View>
        </View>
        
        {/* Security Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="shield-check-outline" size={22} color="#0066CC" />
            <Text style={styles.sectionTitle}>Keamanan</Text>
          </View>
          
          <View style={styles.settingCard}>

            
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => router.push('/onboarding/change-password')}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Ubah Kata Sandi</Text>
                <Text style={styles.settingDescription}>Perbarui kata sandi akun Anda</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#777777" : "#999999"} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Data Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="database-outline" size={22} color="#0066CC" />
            <Text style={styles.sectionTitle}>Data & Sinkronisasi</Text>
          </View>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sinkronisasi Otomatis</Text>
                <Text style={styles.settingDescription}>Perbarui data secara otomatis saat aplikasi dibuka</Text>
              </View>
              <Switch
                trackColor={{ false: "#D1D1D6", true: "#007BFF" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D1D6"
                onValueChange={handleToggleAutoSync}
                value={autoSyncEnabled}
              />
            </View>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={handleClearCache}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Hapus Cache</Text>
                <Text style={styles.settingDescription}>Bersihkan data sementara aplikasi</Text>
              </View>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Support Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="help-circle-outline" size={22} color="#0066CC" />
            <Text style={styles.sectionTitle}>Bantuan & Dukungan</Text>
          </View>
          
          <View style={styles.settingCard}>
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={handleContactSupport}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Hubungi Dukungan</Text>
                <Text style={styles.settingDescription}>Kirim email ke tim dukungan kami</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#777777" : "#999999"} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={handleOpenPrivacyPolicy}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Kebijakan Privasi</Text>
                <Text style={styles.settingDescription}>Baca kebijakan privasi kami</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#777777" : "#999999"} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={handleOpenTermsOfService}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Syarat Layanan</Text>
                <Text style={styles.settingDescription}>Baca syarat layanan kami</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#777777" : "#999999"} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* App Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information-outline" size={22} color="#0066CC" />
            <Text style={styles.sectionTitle}>Tentang Aplikasi</Text>
          </View>
          
          <View style={styles.settingCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Versi Aplikasi</Text>
              <Text style={styles.infoValue}>{appVersion} (Build {buildNumber})</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Perangkat</Text>
              <Text style={styles.infoValue}>{Device.modelName || 'Android/iOS Device'}</Text>
            </View>
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
        
        {/* Footer with copyright and credits */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 ALL RIGHTS RESERVED</Text>
          <Text style={styles.footerText}>CODE BY ANDRE WIJAYA, IQBAL ISYA FATHURROHMAN, NOVANDRA ANUGRAH</Text>
        </View>
      </ScrollView>
      
      <BottomNavBar />
    </SafeAreaView>
  );
}

// Create styles with dynamic values based on theme and screen width
function createStyles(isDark: boolean, width: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#F8F9FA',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 24,
    },
    section: {
      marginTop: 16,
      paddingHorizontal: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#333333',
      marginLeft: 8,
    },
    settingCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settingInfo: {
      flex: 1,
      paddingRight: 16,
    },
    settingLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: isDark ? '#FFFFFF' : '#333333',
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: isDark ? '#AAAAAA' : '#666666',
    },
    settingButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#EEEEEE',
      marginVertical: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    infoLabel: {
      fontSize: 15,
      color: isDark ? '#AAAAAA' : '#666666',
    },
    infoValue: {
      fontSize: 15,
      fontWeight: '500',
      color: isDark ? '#FFFFFF' : '#333333',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF3B30',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginLeft: 8,
    },
    footer: {
      alignItems: 'center',
      marginTop: 24,
      paddingHorizontal: 16,
    },
    footerText: {
      fontSize: 12,
      color: isDark ? '#777777' : '#999999',
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#121212' : '#F8F9FA',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#333333',
    },
  });
}
