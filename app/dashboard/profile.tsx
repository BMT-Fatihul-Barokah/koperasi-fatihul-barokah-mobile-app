import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  useColorScheme,
  useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DashboardHeader } from '../../components/header/dashboard-header';
import { useAuth } from '../../context/auth-context';
import { useData } from '../../context/data-context';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';
import { id as idLocale } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { isLoading, member, account, logout, refreshUserData } = useAuth();
  const { clearCache } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  
  // Create styles with dynamic values based on theme and screen width
  const styles = useMemo(() => createStyles(isDark, width), [isDark, width]);

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
          onPress: () => {
            // Clear data cache before logout
            clearCache();
            logout();
          },
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <DashboardHeader 
        title="Profil Anggota" 
        showBackButton={false}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#003D82', '#0066CC']}
            style={styles.profileGradient}
            start={[0, 0]}
            end={[1, 1]}
          >
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
              
              {/* Member Status Badge */}
              <View style={[
                styles.statusBadge, 
                member?.is_active ? styles.activeBadge : styles.inactiveBadge
              ]}>
                <Text style={styles.statusText}>
                  {member?.is_active ? 'Aktif' : 'Tidak Aktif'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        
        {/* Quick Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="calendar-check" size={24} color="#0066CC" />
            </View>
            <Text style={styles.statValue}>{formatDate(member?.created_at).split(' ')[2] || '-'}</Text>
            <Text style={styles.statLabel}>Tahun Bergabung</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="bank" size={24} color="#0066CC" />
            </View>
            <Text style={styles.statValue}>{member?.nomor_rekening?.substring(0, 4) || '-'}</Text>
            <Text style={styles.statLabel}>Kode Anggota</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="card-account-details" size={24} color="#0066CC" />
            </View>
            <Text style={styles.statValue}>{member?.jenis_identitas || '-'}</Text>
            <Text style={styles.statLabel}>Identitas</Text>
          </View>
        </View>
        
        {/* Account Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-details" size={22} color="#0066CC" />
            <Text style={styles.sectionTitle}>Informasi Rekening</Text>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Rekening</Text>
              <View style={styles.accountNumberContainer}>
                <Text style={styles.infoValue}>{member?.nomor_rekening || '-'}</Text>
                <TouchableOpacity onPress={handleCopyAccountNumber} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={18} color="#0066CC" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Telepon</Text>
              <Text style={styles.infoValue}>{account?.nomor_telepon || '-'}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tanggal Bergabung</Text>
              <Text style={styles.infoValue}>{formatDate(member?.created_at)}</Text>
            </View>
          </View>
        </View>
        
        {/* Personal Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#0066CC" />
            <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alamat</Text>
              <Text style={styles.infoValue}>{member?.alamat || '-'}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kota</Text>
              <Text style={styles.infoValue}>{member?.kota || '-'}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tempat Lahir</Text>
              <Text style={styles.infoValue}>{member?.tempat_lahir || '-'}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tanggal Lahir</Text>
              <Text style={styles.infoValue}>
                {member?.tanggal_lahir ? 
                  format(new Date(member.tanggal_lahir), 'dd MMMM yyyy', { locale: idLocale }) : 
                  '-'
                }
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pekerjaan</Text>
              <Text style={styles.infoValue}>{member?.pekerjaan || '-'}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Identitas</Text>
              <Text style={styles.infoValue}>{member?.nomor_identitas || '-'}</Text>
            </View>
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <BottomNavBar />
    </SafeAreaView>
  );
}

// Create styles with dynamic values based on theme and screen width
function createStyles(isDark: boolean, width: number) {
  const backgroundColor = isDark ? '#121212' : '#F5F7FA';
  const cardBackground = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#333333';
  const secondaryTextColor = isDark ? '#B0B0B0' : '#666666';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: textColor,
    },
    header: {
      width: '100%',
      paddingTop: 8,
      paddingBottom: 16,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
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
      backgroundColor,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    profileCard: {
      marginTop: -20,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    profileGradient: {
      padding: 20,
      paddingBottom: 24,
    },
    profileHeader: {
      alignItems: 'center',
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#fff',
    },
    memberName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 4,
    },
    membershipContainer: {
      marginBottom: 16,
    },
    membershipLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    statusBadge: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeBadge: {
      backgroundColor: 'rgba(46, 204, 113, 0.2)',
    },
    inactiveBadge: {
      backgroundColor: 'rgba(231, 76, 60, 0.2)',
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      marginBottom: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      marginHorizontal: 4,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    statIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(0, 102, 204, 0.1)' : 'rgba(0, 102, 204, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: secondaryTextColor,
      textAlign: 'center',
    },
    infoSection: {
      marginTop: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginLeft: 8,
    },
    infoCard: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: secondaryTextColor,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: textColor,
      flex: 2,
      textAlign: 'right',
    },
    accountNumberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 2,
    },
    copyButton: {
      marginLeft: 8,
      padding: 4,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    logoutButton: {
      backgroundColor: '#E74C3C',
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      marginTop: 24,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    logoutText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
      marginLeft: 8,
    },
    bottomSpacing: {
      height: 80,
    },
  });
}