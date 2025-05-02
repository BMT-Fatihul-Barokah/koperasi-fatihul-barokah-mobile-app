import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth-context';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { isLoading, member, account, logout, refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refresh user data when profile loads
  useEffect(() => {
    refreshUserData();
  }, []);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    setIsRefreshing(false);
  };
  
  const handleCopyAccountNumber = () => {
    if (member?.nomor_rekening) {
      // Instead of using clipboard, just show the account number in an alert
      Alert.alert('Nomor Rekening', member.nomor_rekening);
    }
  };
  
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
          onPress: logout,
        },
      ]
    );
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Tidak tersedia';
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy', { locale: idLocale });
    } catch (error) {
      return 'Format tanggal tidak valid';
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Anggota</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {member?.nama ? member.nama.charAt(0).toUpperCase() : 'A'}
            </Text>
          </View>
          <Text style={styles.memberName}>{member?.nama || 'Anggota'}</Text>
          <View style={styles.membershipContainer}>
            <Text style={styles.membershipLabel}>Anggota Koperasi Fatihul Barokah</Text>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informasi Rekening</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Rekening</Text>
              <View style={styles.accountNumberContainer}>
                <Text style={styles.infoValue}>{member?.nomor_rekening || '-'}</Text>
                <TouchableOpacity onPress={handleCopyAccountNumber}>
                  <Ionicons name="copy-outline" size={20} color="#007BFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Telepon</Text>
              <Text style={styles.infoValue}>{account?.nomor_telepon || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tanggal Bergabung</Text>
              <Text style={styles.infoValue}>{formatDate(member?.created_at)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status Anggota</Text>
              <View style={[
                styles.statusBadge, 
                member?.is_active ? styles.activeBadge : styles.inactiveBadge
              ]}>
                <Text style={styles.statusText}>
                  {member?.is_active ? 'Aktif' : 'Tidak Aktif'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alamat</Text>
              <Text style={styles.infoValue}>{member?.alamat || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kota</Text>
              <Text style={styles.infoValue}>{member?.kota || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tempat Lahir</Text>
              <Text style={styles.infoValue}>{member?.tempat_lahir || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tanggal Lahir</Text>
              <Text style={styles.infoValue}>
                {member?.tanggal_lahir ? 
                  format(new Date(member.tanggal_lahir), 'dd MMMM yyyy', { locale: idLocale }) : 
                  '-'
                }
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pekerjaan</Text>
              <Text style={styles.infoValue}>{member?.pekerjaan || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jenis Identitas</Text>
              <Text style={styles.infoValue}>{member?.jenis_identitas || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Identitas</Text>
              <Text style={styles.infoValue}>
                {member?.nomor_identitas ? 
                  `${member.nomor_identitas.substring(0, 4)}********${member.nomor_identitas.substring(member.nomor_identitas.length - 4)}` : 
                  '-'
                }
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Koperasi Fatihul Barokah v1.0.0</Text>
        </View>
      </ScrollView>
      
      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/dashboard')}
        >
          <Image 
            source={require('../../assets/Beranda.png')} 
            style={styles.navIcon} 
            resizeMode="contain"
            tintColor="#999"
          />
          <Text style={styles.navText}>Beranda</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/activity')}
        >
          <Image 
            source={require('../../assets/aktifitas.png')} 
            style={styles.navIcon} 
            resizeMode="contain"
            tintColor="#999"
          />
          <Text style={styles.navText}>Aktifitas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/dashboard/notifications')}
        >
          <Image 
            source={require('../../assets/notifikasi.png')} 
            style={styles.navIcon} 
            resizeMode="contain"
            tintColor="#999"
          />
          <Text style={styles.navText}>Notifikasi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Image 
            source={require('../../assets/profil.png')} 
            style={[styles.navIcon, styles.activeNavIcon]} 
            resizeMode="contain"
          />
          <Text style={[styles.navText, styles.activeNavText]}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007BFF',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  membershipContainer: {
    backgroundColor: '#E6F2FF',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  membershipLabel: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '500',
  },
  infoSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#E6F7EE',
  },
  inactiveBadge: {
    backgroundColor: '#FFEAEA',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeText: {
    color: '#00A651',
  },
  inactiveText: {
    color: '#FF4D4D',
  },
  logoutButton: {
    backgroundColor: '#FF4D4D',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 36,
    height: 36,
    marginBottom: 6,
  },
  activeNavIcon: {
    tintColor: '#007BFF',
  },
  navText: {
    fontSize: 14,
    color: '#999',
  },
  activeNavText: {
    color: '#007BFF',
  }
});
