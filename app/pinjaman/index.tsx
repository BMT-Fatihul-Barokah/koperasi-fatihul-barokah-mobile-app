import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth-context';
import { DashboardHeader } from '../../components/header/dashboard-header';
import { BottomNavBar } from '../../components/navigation/BottomNavBar';
import { formatCurrency } from '../../lib/format-utils';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Pinjaman, PinjamanService } from '../../services/pinjaman.service';

export default function PinjamanScreen() {
  const { isLoading: authLoading, isAuthenticated, member } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loans, setLoans] = useState<Pinjaman[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();

  // Create styles with dynamic values based on theme and dimensions
  const styles = useMemo(() => createStyles(isDark, width), [isDark, width]);

  // Fetch loans data
  const fetchLoans = useCallback(async () => {
    if (!isAuthenticated || !member?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching loans for member:', member.id);
      
      const pinjamanData = await PinjamanService.getPinjamanByAnggota(member.id);
      console.log(`Fetched ${pinjamanData.length} loans`);
      setLoans(pinjamanData);
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError('Gagal memuat data pinjaman. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, member?.id]);

  // Fetch loans when component mounts
  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLoans();
    setRefreshing(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy', { locale: idLocale });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Handle loan detail view
  const handleViewLoanDetail = (loanId: string) => {
    router.push(`/pinjaman/${loanId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <DashboardHeader title="Pinjaman" showBackButton={false} />
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
          {/* Active Loans Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pinjaman Aktif</Text>
              <TouchableOpacity
                onPress={() => router.push('/pinjaman/history')}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>Lihat Riwayat</Text>
                <Ionicons name="chevron-forward" size={16} color="#007BFF" />
              </TouchableOpacity>
            </View>

            {/* Loading State */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Memuat data pinjaman...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchLoans}
                >
                  <Text style={styles.retryText}>Coba Lagi</Text>
                </TouchableOpacity>
              </View>
            ) : loans.length > 0 ? (
              loans.map((loan) => (
                <TouchableOpacity
                  key={loan.id}
                  style={styles.loanCard}
                  onPress={() => handleViewLoanDetail(loan.id)}
                >
                  <View style={styles.loanHeader}>
                    <Text style={styles.loanName}>{loan.jenis_pinjaman}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: PinjamanService.getStatusColor(loan.status) }]}>
                      <Text style={styles.statusText}>{PinjamanService.getStatusLabel(loan.status)}</Text>
                    </View>
                  </View>

                  <View style={styles.loanDetails}>
                    <View style={styles.loanDetailRow}>
                      <Text style={styles.loanDetailLabel}>Jumlah Pinjaman</Text>
                      <Text style={styles.loanDetailValue}>{formatCurrency(loan.jumlah)}</Text>
                    </View>
                    <View style={styles.loanDetailRow}>
                      <Text style={styles.loanDetailLabel}>Tanggal Pengajuan</Text>
                      <Text style={styles.loanDetailValue}>{formatDate(loan.created_at)}</Text>
                    </View>
                    <View style={styles.loanDetailRow}>
                      <Text style={styles.loanDetailLabel}>Jatuh Tempo</Text>
                      <Text style={styles.loanDetailValue}>{formatDate(loan.jatuh_tempo)}</Text>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[styles.progressFill, { width: `${PinjamanService.calculateProgress(loan)}%` }]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {PinjamanService.calculateProgress(loan)}% Terbayar
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="credit-card-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>Tidak ada pinjaman aktif</Text>
                <Text style={styles.emptyStateSubtext}>Anda belum memiliki pinjaman aktif saat ini</Text>
              </View>
            )}
          </View>
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
  },
  section: {
    marginBottom: 24,
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#FFFFFF' : '#333333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007BFF',
    marginRight: 4,
  },
  loanCard: {
    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDark ? '#333333' : '#EEEEEE',
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanName: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#333333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loanDetails: {
    marginBottom: 12,
  },
  loanDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loanDetailLabel: {
    fontSize: 14,
    color: isDark ? '#AAAAAA' : '#666666',
  },
  loanDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#FFFFFF' : '#333333',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: isDark ? '#333333' : '#EEEEEE',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: isDark ? '#AAAAAA' : '#666666',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#333333',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: isDark ? '#AAAAAA' : '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
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
    borderRadius: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  }
});
