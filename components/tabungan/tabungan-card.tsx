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
}

export function TabunganCard({ tabungan, onPress }: TabunganCardProps) {
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
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => onPress(tabungan)}
    >
      <LinearGradient colors={getGradientColors() as any} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>{getTabunganIcon()}</View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{tabungan.jenis_tabungan.nama}</Text>
              <Text style={styles.accountNumber}>{tabungan.nomor_rekening}</Text>
            </View>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Saldo Aktif</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balance}>{formatCurrency(tabungan.saldo)}</Text>
              <TouchableOpacity style={styles.eyeButton}>
                <Ionicons name="eye-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {hasGoal && (
              <View style={styles.goalContainer}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalText}>Target: {formatCurrency(tabungan.target_amount)}</Text>
                  <Text style={styles.goalPercentage}>{tabungan.progress_percentage}%</Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${tabungan.progress_percentage}%` }]} />
                </View>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.lastTransactionContainer}>
              <Text style={styles.lastTransactionLabel}>Transaksi Terakhir:</Text>
              <Text style={styles.lastTransactionDate}>{formatLastTransaction()}</Text>
            </View>
            <TouchableOpacity style={styles.transactionsButton}>
              <Text style={styles.transactionsText}>Riwayat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 8,
    height: 230,
  },
  gradient: {
    borderRadius: 12,
    height: '100%',
  },
  content: {
    padding: 16,
    height: '100%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  accountNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  balanceContainer: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  eyeButton: {
    padding: 5,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  transactionsText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
  },
});
