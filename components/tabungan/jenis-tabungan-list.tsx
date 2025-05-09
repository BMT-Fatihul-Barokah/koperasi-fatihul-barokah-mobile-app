import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JenisTabungan } from '../../lib/database.types';
import { formatCurrency } from '../../lib/format-utils';
import { useColorScheme } from 'react-native';

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
        return 'wallet-outline';
      case 'SIMUROJA':
        return 'trending-up-outline';
      case 'SIDIKA':
        return 'school-outline';
      case 'SIFITRI':
        return 'gift-outline';
      case 'SIQURBAN':
        return 'paw-outline';
      case 'SINIKA':
        return 'heart-outline';
      case 'SIUMROH':
        return 'airplane-outline';
      default:
        return 'wallet-outline';
    }
  };

  // Get color based on jenis tabungan
  const getColor = (kode: string) => {
    switch (kode) {
      case 'SIBAROKAH':
        return isDark ? '#3584e4' : '#3584e4';
      case 'SIMUROJA':
        return isDark ? '#9141ac' : '#9141ac';
      case 'SIDIKA':
        return isDark ? '#e01b24' : '#e01b24';
      case 'SIFITRI':
        return isDark ? '#986a44' : '#986a44';
      case 'SIQURBAN':
        return isDark ? '#2ec27e' : '#26a269';
      case 'SINIKA':
        return isDark ? '#c061cb' : '#c061cb';
      case 'SIUMROH':
        return isDark ? '#26a269' : '#26a269';
      default:
        return isDark ? '#3584e4' : '#3584e4';
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
      <View 
        style={[
          styles.iconContainer, 
          { backgroundColor: getColor(item.kode) }
        ]}
      >
        <Ionicons name={getIcon(item.kode)} size={24} color="white" />
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.nameText}>{item.nama}</Text>
        <Text style={styles.descriptionText}>{item.deskripsi || 'Simpanan anggota koperasi'}</Text>
        
        <View style={styles.detailsRow}>
          {item.minimum_setoran > 0 && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Minimum Setoran</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.minimum_setoran)}</Text>
            </View>
          )}
          
          {item.bagi_hasil && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Bagi Hasil</Text>
              <Text style={styles.detailValue}>{item.bagi_hasil}%</Text>
            </View>
          )}
          
          {item.jangka_waktu && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Jangka Waktu</Text>
              <Text style={styles.detailValue}>{item.jangka_waktu} bulan</Text>
            </View>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#999" />
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    marginRight: 16,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
