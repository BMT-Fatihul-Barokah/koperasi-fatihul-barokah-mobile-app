import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  useWindowDimensions,
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { BackHeader } from '../../components/header/back-header';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';
import { formatCurrency } from '../../lib/format-utils';
import { format, addMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useAuth } from '../../context/auth-context';
import { Pinjaman, PinjamanService } from '../../services/pinjaman.service';

export default function PinjamanDetailScreen() {
  const params = useLocalSearchParams();
  const loanId = params.id as string;
  const { member } = useAuth();
  const [loan, setLoan] = useState<Pinjaman | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();

  // Create styles with dynamic values based on theme and dimensions
  const styles = useMemo(() => createStyles(isDark, width), [isDark, width]);

  // Fetch loan data
  const fetchLoanData = async () => {
    if (!loanId) {
      setError('ID pinjaman tidak ditemukan');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const loanData = await PinjamanService.getPinjamanById(loanId);
      
      if (!loanData) {
        setError('Pinjaman tidak ditemukan');
      } else {
        setLoan(loanData);
      }
    } catch (err) {
      console.error('Error fetching loan details:', err);
      setError('Gagal memuat data pinjaman. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch loan data when component mounts
  useEffect(() => {
    fetchLoanData();
  }, [loanId]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLoanData();
    setRefreshing(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: idLocale });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    return PinjamanService.getStatusColor(status);
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    return PinjamanService.getStatusLabel(status);
  };

  // Calculate progress
  const calculateProgress = (pinjaman: Pinjaman) => {
    return PinjamanService.calculateProgress(pinjaman);
  };

  // Get loan icon based on loan type
  const getLoanIcon = (jenisPinjaman: string) => {
    if (jenisPinjaman.toLowerCase().includes('usaha')) return 'store';
    if (jenisPinjaman.toLowerCase().includes('pendidikan')) return 'graduation-cap';
    if (jenisPinjaman.toLowerCase().includes('kesehatan')) return 'heartbeat';
    if (jenisPinjaman.toLowerCase().includes('renovasi')) return 'home';
    if (jenisPinjaman.toLowerCase().includes('kendaraan')) return 'car';
    return 'money-bill-wave';
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BackHeader title="Detail Pinjaman" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Memuat data pinjaman...</Text>
        </View>
        <BottomNavBar />
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BackHeader title="Detail Pinjaman" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchLoanData}
          >
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
        <BottomNavBar />
      </SafeAreaView>
    );
  }

  // Render loan not found state
  if (!loan) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BackHeader title="Detail Pinjaman" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="credit-card-off-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>Pinjaman tidak ditemukan</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryText}>Kembali</Text>
          </TouchableOpacity>
        </View>
        <BottomNavBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BackHeader title="Detail Pinjaman" />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007BFF']}
            tintColor={isDark ? '#FFFFFF' : '#007BFF'}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.loanHeaderDetailed}>
            <View style={styles.loanTypeContainer}>
              <FontAwesome5 
                name={getLoanIcon(loan.jenis_pinjaman)} 
                size={24} 
                color={isDark ? '#FFFFFF' : '#333333'} 
              />
              <Text style={styles.loanTypeText}>{loan.jenis_pinjaman}</Text>
            </View>
            <View style={[styles.statusBadgeDetailed, { backgroundColor: getStatusColor(loan.status) }]}>
              <Text style={styles.statusTextDetailed}>{getStatusLabel(loan.status)}</Text>
            </View>
          </View>
          
          <View style={styles.loanAmountContainer}>
            <Text style={styles.loanAmountLabel}>Jumlah Pinjaman</Text>
            <Text style={styles.loanAmountValue}>{formatCurrency(loan.jumlah)}</Text>
          </View>
          
          {/* Progress bar for active loans */}
          {loan.status === 'aktif' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progress Pembayaran</Text>
                <Text style={styles.progressPercentage}>{calculateProgress(loan)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${calculateProgress(loan)}%` }]} 
                />
              </View>
              <View style={styles.progressDetails}>
                <Text style={styles.progressDetailText}>
                  Terbayar: {formatCurrency(loan.total_pembayaran - loan.sisa_pembayaran)}
                </Text>
                <Text style={styles.progressDetailText}>
                  Sisa: {formatCurrency(loan.sisa_pembayaran)}
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.detailsCard}>
            <Text style={styles.detailsCardTitle}>Informasi Pinjaman</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tanggal Pengajuan</Text>
              <Text style={styles.detailValue}>{formatDate(loan.created_at)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Jatuh Tempo</Text>
              <Text style={styles.detailValue}>{formatDate(loan.jatuh_tempo)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Pembayaran</Text>
              <Text style={styles.detailValue}>{formatCurrency(loan.total_pembayaran)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sisa Pembayaran</Text>
              <Text style={styles.detailValue}>{formatCurrency(loan.sisa_pembayaran)}</Text>
            </View>
            
            {loan.status === 'lunas' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tanggal Pelunasan</Text>
                <Text style={styles.detailValue}>{formatDate(loan.updated_at)}</Text>
              </View>
            )}
            
            {loan.status === 'ditolak' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tanggal Penolakan</Text>
                <Text style={styles.detailValue}>{formatDate(loan.updated_at)}</Text>
              </View>
            )}
          </View>
          
          {/* Payment schedule - This would require additional data from the API */}
          <View style={styles.paymentScheduleCard}>
            <Text style={styles.paymentScheduleTitle}>Jadwal Pembayaran</Text>
            {/* This is a placeholder. In a real implementation, you would fetch the actual payment schedule from the API */}
            {Array.from({ length: 6 }).map((_, index) => {
              const installmentDate = addMonths(new Date(loan.created_at), index + 1);
              const isPaid = loan.status === 'lunas' || 
                            (loan.status === 'aktif' && 
                             new Date() > installmentDate && 
                             index < Math.floor(calculateProgress(loan) / (100 / 6)));
              
              return (
                <View key={index} style={styles.scheduleRow}>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleMonth}>Angsuran {index + 1}</Text>
                    <Text style={styles.scheduleDate}>{format(installmentDate, 'dd MMMM yyyy', { locale: idLocale })}</Text>
                  </View>
                  <View style={styles.scheduleAmount}>
                    <Text style={styles.scheduleAmountText}>{formatCurrency(loan.total_pembayaran / 6)}</Text>
                    {isPaid && (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidText}>Terbayar</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          
          {/* Action buttons based on loan status */}
          {loan.status === 'aktif' && (
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="cash-multiple" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Bayar Angsuran</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {loan.status === 'diajukan' && (
            <View style={styles.actionContainer}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F44336' }]}>
                <MaterialCommunityIcons name="close-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Batalkan Pengajuan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      
      <BottomNavBar />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean, width: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: isDark ? '#AAAAAA' : '#666666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: isDark ? '#F44336' : '#F44336',
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loanHeaderDetailed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  loanTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loanTypeText: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#333333',
    marginLeft: 12,
  },
  statusBadgeDetailed: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusTextDetailed: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loanAmountContainer: {
    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  loanAmountLabel: {
    fontSize: 14,
    color: isDark ? '#AAAAAA' : '#666666',
    marginBottom: 8,
  },
  loanAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#FFFFFF' : '#333333',
  },
  progressContainer: {
    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#333333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  progressBar: {
    height: 8,
    backgroundColor: isDark ? '#333333' : '#EEEEEE',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDetailText: {
    fontSize: 14,
    color: isDark ? '#AAAAAA' : '#666666',
  },
  detailsCard: {
    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  detailsCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#333333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#EEEEEE',
  },
  detailLabel: {
    fontSize: 14,
    color: isDark ? '#AAAAAA' : '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#FFFFFF' : '#333333',
    textAlign: 'right',
  },
  paymentScheduleCard: {
    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentScheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#333333',
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#EEEEEE',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleMonth: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#FFFFFF' : '#333333',
    marginBottom: 4,
  },
  scheduleDate: {
    fontSize: 12,
    color: isDark ? '#AAAAAA' : '#666666',
  },
  scheduleAmount: {
    alignItems: 'flex-end',
  },
  scheduleAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#FFFFFF' : '#333333',
    marginBottom: 4,
  },
  paidBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#007BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
