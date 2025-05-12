import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TabunganWithJenis } from '../../lib/database.types';
import { TabunganService } from '../../services/tabungan.service';
import { TabunganCard } from '../../components/tabungan/tabungan-card';
import { formatCurrency } from '../../lib/format-utils';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DatabaseService } from '../../lib/database.service';
import { storage } from '../../lib/storage';

export default function TabunganScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [tabunganList, setTabunganList] = useState<TabunganWithJenis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [anggotaId, setAnggotaId] = useState<string | null>(null);
  
  // Calculate number of columns based on screen width
  const numColumns = width > 600 ? 2 : 1;
  // Add a bit more padding for better spacing
  const cardWidth = width > 600 ? (width - 64) / numColumns : width - 32;
  
  // Fetch member ID and savings accounts
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Get account details to get anggota_id
        const accountId = await storage.getItem('koperasi_auth_account_id');
        if (!accountId) {
          router.replace('/');
          return;
        }
        
        const accountDetails = await DatabaseService.getAccountDetails(accountId);
        if (!accountDetails) {
          router.replace('/');
          return;
        }
        
        setAnggotaId(accountDetails.member.id);
        
        // Fetch tabungan list
        const tabunganData = await TabunganService.getTabunganByAnggota(accountDetails.member.id);
        setTabunganList(tabunganData);
        
        // Calculate total saldo
        const total = tabunganData.reduce((sum, item) => sum + item.saldo, 0);
        setTotalSaldo(total);
      } catch (error) {
        console.error('Error fetching tabungan data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [router]);
  
  // Handle refresh
  const handleRefresh = async () => {
    if (!anggotaId) return;
    
    try {
      setRefreshing(true);
      const tabunganData = await TabunganService.getTabunganByAnggota(anggotaId);
      setTabunganList(tabunganData);
      
      const total = tabunganData.reduce((sum, item) => sum + item.saldo, 0);
      setTotalSaldo(total);
    } catch (error) {
      console.error('Error refreshing tabungan data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle tabungan card press
  const handleTabunganPress = (tabungan: TabunganWithJenis) => {
    router.push(`/tabungan/${tabungan.id}`);
  };
  
  // Handle new tabungan button press
  const handleNewTabungan = () => {
    router.push('/tabungan/new');
  };
  
  // Render item for FlatList
  const renderTabunganItem = ({ item }: { item: TabunganWithJenis }) => (
    <View style={[styles.gridItem, { width: cardWidth }]}>
      <TabunganCard
        tabungan={item}
        onPress={handleTabunganPress}
        showTarget={true} // Show target progress bar in the main tabungan screen
      />
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          title: 'Detail Tabungan',
          headerStyle: {
            backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleNewTabungan}
            >
              <Ionicons name="add-circle" size={24} color="#007BFF" />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* Summary Card */}
      <View style={styles.summaryCardContainer}>
        <LinearGradient
          colors={isDark ? ['#1a5fb4', '#3584e4'] : ['#3584e4', '#62a0ea']}
          style={styles.summaryCard}
          start={[0, 0]}
          end={[1, 1]}
        >
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Saldo Tabungan</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalSaldo)}</Text>
            <Text style={styles.summaryAccounts}>
              {tabunganList.length} {tabunganList.length > 1 ? 'Rekening' : 'Rekening'}
            </Text>
          </View>
        </LinearGradient>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Memuat data tabungan...</Text>
        </View>
      ) : tabunganList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>
            Anda belum memiliki rekening tabungan
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleNewTabungan}
          >
            <Text style={styles.emptyButtonText}>Buka Rekening Baru</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tabunganList}
          renderItem={renderTabunganItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerButton: {
    padding: 8,
  },
  summaryCardContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  summaryAmount: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 36,
    marginBottom: 12,
  },
  summaryAccounts: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  gridContainer: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: 16,
  },
  itemSeparator: {
    height: 8,
  },
  loadingContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
});
