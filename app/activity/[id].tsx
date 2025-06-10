import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Share,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { BackHeader } from '../../components/header/back-header';
import { Ionicons } from '@expo/vector-icons';

// Define transaction interface based on the database schema
interface Transaction {
  id: string;
  anggota_id: string;
  tipe_transaksi: 'masuk' | 'keluar';
  kategori: string;
  deskripsi: string;
  reference_number?: string;
  jumlah: number;
  saldo_sebelum: number;
  saldo_sesudah: number;
  created_at: string;
  updated_at: string;
  recipient_name?: string;
  bank_name?: string;
  tabungan_id?: string;
  nomor_rekening?: string;
  jenis_tabungan?: {
    id: string;
    nama: string;
    kode: string;
    deskripsi?: string;
  };
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const { isAuthenticated, member } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated || !member || !id) {
      router.replace('/');
      return;
    }

    const fetchTransactionDetail = async () => {
      setIsLoading(true);
      try {
        // Fetch transaction with tabungan (savings) information
        const { data, error } = await supabase
          .from('transaksi')
          .select(`
            *,
            tabungan:tabungan_id(id, jenis_tabungan:jenis_tabungan_id(id, nama, kode, deskripsi)),
            anggota:anggota_id(id, nomor_rekening)
          `)
          .eq('id', id)
          .eq('anggota_id', member.id)
          .single();

        if (error) {
          console.error('Error fetching transaction:', error);
          setIsLoading(false);
          return;
        }

        // Add mock recipient data for demo purposes
        // In a real app, this would come from the database
        let recipientName, bankName;
        
        if (data.kategori === 'transfer') {
          if (data.deskripsi?.includes('BLU')) {
            recipientName = 'NOVANDRA ANUGRAH';
            bankName = 'BLU BY BCA DIGITAL';
          } else if (data.deskripsi?.includes('SHOPEE')) {
            recipientName = 'SHOPEE - nXXXXXXXX9';
            bankName = 'BCA Virtual Account';
          } else if (data.deskripsi?.includes('OVO')) {
            recipientName = 'NOVANDRA ANUGRAH';
            bankName = 'OVO';
          }
        }
        
        // Extract jenis_tabungan and nomor_rekening from nested data structure if available
        const jenis_tabungan = data.tabungan?.jenis_tabungan || null;
        const tabungan_id = data.tabungan_id || null;
        const nomor_rekening = data.anggota?.nomor_rekening || null;
        
        setTransaction({
          ...data,
          recipient_name: recipientName,
          bank_name: bankName,
          tabungan_id,
          jenis_tabungan,
          nomor_rekening
        });
      } catch (error: any) {
        console.error('Error in transaction detail fetch:', error);
        setError(error?.message || 'Terjadi kesalahan saat memuat transaksi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetail();
  }, [id, isAuthenticated, member]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date for display
  const formatTransactionDate = (dateString: string) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, 'dd MMMM yyyy, HH:mm');
  };

  // Share transaction details
  const shareTransaction = async () => {
    if (!transaction) return;
    
    try {
      await Share.share({
        message: `Transaksi ${transaction.deskripsi}\n` +
                `Tanggal: ${formatTransactionDate(transaction.created_at)}\n` +
                `Jumlah: ${formatCurrency(Number(transaction.jumlah))}\n` +
                `Status: Berhasil\n` +
                `ID Transaksi: ${transaction.id}\n` +
                `Referensi: ${transaction.reference_number || '-'}`
      });
    } catch (error) {
      console.error('Error sharing transaction:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Memuat detail transaksi...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
        <Text style={styles.errorText}>{error || 'Transaksi tidak ditemukan'}</Text>
        <TouchableOpacity 
          style={styles.backToActivityButton}
          onPress={() => router.replace('/activity')}
        >
          <Text style={styles.backToActivityText}>Kembali ke Aktivitas</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <BackHeader 
        title="Detail Transaksi"
        rightComponent={
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={shareTransaction}
          >
            <Text style={styles.shareButtonText}>⋮</Text>
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>
            {transaction.tipe_transaksi === 'masuk' ? 'Penerimaan' : 'Pengeluaran'}
          </Text>
          <Text style={[
            styles.amountText,
            transaction.tipe_transaksi === 'masuk' ? styles.creditAmount : styles.debitAmount
          ]}>
            {transaction.tipe_transaksi === 'masuk' ? '+' : '-'} {formatCurrency(Number(transaction.jumlah))}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Successful</Text>
          </View>
        </View>
        
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Detail Transaksi</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tanggal</Text>
            <Text style={styles.detailValue}>{formatTransactionDate(transaction.created_at)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Jenis Transaksi</Text>
            <Text style={styles.detailValue}>
              {transaction.kategori 
                ? transaction.kategori.replace(/_/g, ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                : '-'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Jenis Tabungan</Text>
            <Text style={styles.detailValue}>
              {transaction.jenis_tabungan 
                ? `${transaction.jenis_tabungan.nama} (${transaction.jenis_tabungan.kode})` 
                : '-'}
            </Text>
          </View>
          
          {transaction.recipient_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Penerima</Text>
              <Text style={styles.detailValue}>{transaction.recipient_name}</Text>
            </View>
          )}
          
          {transaction.bank_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank</Text>
              <Text style={styles.detailValue}>{transaction.bank_name}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deskripsi</Text>
            <Text style={styles.detailValue}>{transaction.deskripsi}</Text>
          </View>
          
          {transaction.reference_number && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nomor Referensi</Text>
              <Text style={styles.detailValue}>{transaction.reference_number}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.balanceCard}>
          <Text style={styles.detailsTitle}>Informasi Saldo</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Saldo Sebelum</Text>
            <Text style={styles.detailValue}>{formatCurrency(Number(transaction.saldo_sebelum))}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Saldo Sesudah</Text>
            <Text style={styles.detailValue}>{formatCurrency(Number(transaction.saldo_sesudah))}</Text>
          </View>
        </View>
        
        <View style={styles.idCard}>
          <Text style={styles.detailsTitle}>Informasi ID</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID Transaksi</Text>
            <Text style={styles.detailValue}>{transaction.id}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportButtonText}>Laporkan Masalah</Text>
        </TouchableOpacity>
      </ScrollView>
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backToActivityButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backToActivityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 20,
  },

  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  placeholderButton: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  amountText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  creditAmount: {
    color: '#28a745',
  },
  debitAmount: {
    color: '#dc3545',
  },
  statusBadge: {
    backgroundColor: '#e6f7e6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  idCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  reportButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  reportButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});
