import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { JenisTabungan } from '../../lib/database.types';
import { formatCurrency } from '../../lib/format-utils';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface JenisTabunganListProps {
  jenisTabungan: JenisTabungan[];
  onSelect: (jenis: JenisTabungan) => void;
  isLoading: boolean;
}

export function JenisTabunganList({ 
  jenisTabungan, 
  onSelect, 
  isLoading 
}: JenisTabunganListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get icon based on jenis tabungan
  const getIcon = (kode: string) => {
    switch (kode) {
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

  // Get gradient colors based on jenis tabungan
  const getGradientColors = (kode: string) => {
    switch (kode) {
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

  const renderItem = ({ item }: { item: JenisTabungan }) => (
    <Pressable
      onPress={() => onSelect(item)}
      style={({ pressed }) => [
        styles.itemContainer,
        { opacity: pressed ? 0.8 : 1 }
      ]}
    >
      <LinearGradient 
        colors={getGradientColors(item.kode) as any}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              {getIcon(item.kode)}
            </View>
            
            <View style={styles.titleContainer}>
              <Text style={styles.nameText}>{item.nama}</Text>
              <Text style={styles.descriptionText}>{item.deskripsi || 'Simpanan anggota koperasi'}</Text>
            </View>
            
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailsRow}>
              {item.minimum_setoran > 0 && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <MaterialCommunityIcons name="cash-multiple" size={16} color="rgba(255,255,255,0.9)" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Minimum Setoran</Text>
                    <Text style={styles.detailValue}>{formatCurrency(item.minimum_setoran)}</Text>
                  </View>
                </View>
              )}
              
              {item.bagi_hasil && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <MaterialCommunityIcons name="percent" size={16} color="rgba(255,255,255,0.9)" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Bagi Hasil</Text>
                    <Text style={styles.detailValue}>{item.bagi_hasil}%</Text>
                  </View>
                </View>
              )}
              
              {item.jangka_waktu && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <MaterialCommunityIcons name="calendar-range" size={16} color="rgba(255,255,255,0.9)" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Jangka Waktu</Text>
                    <Text style={styles.detailValue}>{item.jangka_waktu} bulan</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Memuat jenis tabungan...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={jenisTabungan}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  itemContainer: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  arrowContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    marginTop: 4,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  detailIconContainer: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});
