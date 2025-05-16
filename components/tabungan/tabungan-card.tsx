import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { TabunganWithJenis } from '../../lib/database.types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCurrency } from '../../lib/format-utils';

interface TabunganCardProps {
  tabungan: TabunganWithJenis;
  onPress: (tabungan: TabunganWithJenis) => void;
  compact?: boolean; // Optional prop for compact mode in dashboard
  showTarget?: boolean; // Optional prop to show savings target progress bar
}

export function TabunganCard({ tabungan, onPress, compact = false, showTarget = false }: TabunganCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Different gradient colors based on jenis tabungan
  const getGradientColors = () => {
    switch (tabungan.jenis_tabungan.kode) {
      case 'SIBAROKAH':
        return isDark ? ['#003D82', '#0066CC'] : ['#003D82', '#0066CC'];
      case 'SIMUROJA':
        return isDark ? ['#004D40', '#00796B'] : ['#004D40', '#00796B'];
      case 'SIDIKA':
        return isDark ? ['#4A148C', '#7B1FA2'] : ['#4A148C', '#7B1FA2'];
      case 'SIFITRI':
        return isDark ? ['#1A237E', '#303F9F'] : ['#1A237E', '#303F9F'];
      case 'SIQURBAN':
        return isDark ? ['#BF360C', '#E64A19'] : ['#BF360C', '#E64A19'];
      case 'SINIKA':
        return isDark ? ['#880E4F', '#C2185B'] : ['#880E4F', '#C2185B'];
      case 'SIUMROH':
        return isDark ? ['#0D47A1', '#1976D2'] : ['#0D47A1', '#1976D2'];
      default:
        return isDark ? ['#003D82', '#0066CC'] : ['#003D82', '#0066CC'];
    }
  };

  // Get icon based on jenis tabungan
  const getTabunganIcon = () => {
    switch (tabungan.jenis_tabungan.kode) {
      case 'SIBAROKAH':
        return <MaterialCommunityIcons name="bank" size={24} color="white" />;
      case 'SIMUROJA':
        return <MaterialCommunityIcons name="calendar-clock" size={24} color="white" />;
      case 'SIDIKA':
        return <MaterialCommunityIcons name="school" size={24} color="white" />;
      case 'SIFITRI':
        return <MaterialCommunityIcons name="star-crescent" size={24} color="white" />;
      case 'SIQURBAN':
        return <MaterialCommunityIcons name="sheep" size={24} color="white" />;
      case 'SINIKA':
        return <MaterialCommunityIcons name="ring" size={24} color="white" />;
      case 'SIUMROH':
        return <MaterialCommunityIcons name="mosque" size={24} color="white" />;
      default:
        return <MaterialCommunityIcons name="bank" size={24} color="white" />;
    }
  };

  // Format date for last transaction
  const formatLastTransaction = () => {
    if (!tabungan.last_transaction_date) return 'Belum ada transaksi';

    const date = new Date(tabungan.last_transaction_date);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Has savings goal
  const hasGoal = tabungan.target_amount && tabungan.target_amount > 0;

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      activeOpacity={0.9}
      onPress={() => onPress(tabungan)}
    >
      <LinearGradient colors={getGradientColors() as any} style={styles.gradient} start={[0, 0]} end={[1, 1]}>
        <View style={[styles.content, compact && styles.compactContent]}>
          <View style={[styles.header, compact && styles.compactHeader]}>
            <View style={[styles.iconContainer, compact && styles.compactIconContainer]}>{getTabunganIcon()}</View>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, compact && styles.compactTitle]}>{tabungan.jenis_tabungan.nama}</Text>
              <Text style={styles.accountNumber}>{tabungan.nomor_rekening}</Text>
            </View>
          </View>

          <View style={[styles.balanceContainer, compact && styles.compactBalanceContainer]}>
            <Text style={[styles.balanceLabel, compact && styles.compactBalanceLabel]}>Saldo Aktif</Text>
            <View style={styles.balanceRow}>
              <Text style={[styles.balance, compact && styles.compactBalance]}>{formatCurrency(tabungan.saldo)}</Text>
              <TouchableOpacity style={styles.eyeButton}>
                <Ionicons name="eye-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          {showTarget && tabungan.target_saldo && tabungan.target_saldo > 0 && (
            <View style={styles.targetContainer}>
              <View style={styles.targetLabelRow}>
                <Text style={styles.targetLabel}>Target: {formatCurrency(tabungan.target_saldo)}</Text>
                <Text style={styles.targetPercentage}>{Math.min(100, Math.round((tabungan.saldo / (tabungan.target_saldo || 1)) * 100))}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[styles.progressBar, { width: `${Math.min(100, Math.round((tabungan.saldo / (tabungan.target_saldo || 1)) * 100))}%` }]} 
                />
              </View>
            </View>
          )}

          {!compact ? (
            <View style={styles.footer}>
              <View style={styles.lastTransactionContainer}>
                <Text style={styles.lastTransactionLabel}>Transaksi Terakhir:</Text>
                <Text style={styles.lastTransactionDate}>{formatLastTransaction()}</Text>
              </View>
              <TouchableOpacity style={styles.transactionsButton}>
                <Text style={styles.transactionsText}>Riwayat</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.compactFooter}>
              <Text style={styles.lastTransactionLabel}>Transaksi Terakhir:</Text>
              <Text style={styles.lastTransactionDate}>{formatLastTransaction()}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    height: 170, // Fixed height that works for all cards
  },
  compactContainer: {
    height: 160,
  },
  gradient: {
    borderRadius: 16,
    height: '100%',
  },
  content: {
    padding: 14,
    height: '100%',
    justifyContent: 'space-between',
  },
  compactContent: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  compactHeader: {
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  compactTitle: {
    fontSize: 14,
  },
  accountNumber: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  balanceContainer: {
    marginBottom: 8,
  },
  compactBalanceContainer: {
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  compactBalanceLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balance: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  compactBalance: {
    fontSize: 18,
  },
  targetContainer: {
    marginVertical: 4,
  },
  targetLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  targetLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  targetPercentage: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  eyeButton: {
    padding: 4,
  },
  goalContainer: {
    marginTop: 12,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  goalPercentage: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastTransactionContainer: {
    flex: 1,
  },
  lastTransactionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  lastTransactionDate: {
    fontSize: 12,
    color: 'white',
  },
  transactionsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  transactionsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  compactFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: 'white',
  },
});
