import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { TabunganWithJenis } from '../../lib/database.types';
import { TabunganCard } from './tabungan-card';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../lib/format-utils';
import { LinearGradient } from 'expo-linear-gradient';

interface TabunganCarouselProps {
  tabunganList: TabunganWithJenis[];
  onViewAllPress: () => void;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 320;
const ITEM_SPACING = 16;

export function TabunganCarousel({ tabunganList, onViewAllPress }: TabunganCarouselProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Calculate total balance of all savings accounts
  const totalSaldo = tabunganList.reduce((sum, item) => sum + item.saldo, 0);
  
  // Handle tabungan card press
  const handleTabunganPress = (tabungan: TabunganWithJenis) => {
    router.push(`/tabungan/${tabungan.id}`);
  };
  
  // Handle pagination dot press
  const handleDotPress = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5
      });
    }
  };
  
  // Handle scroll end to update active index
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    
    // Calculate the current index based on the scroll position
    const newIndex = Math.floor(contentOffset.x / (ITEM_WIDTH + ITEM_SPACING));
    
    // Only update if the index has changed and is valid
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tabunganList.length) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, tabunganList.length]);
  
  // Render carousel item
  const renderCarouselItem = ({ item }: { item: TabunganWithJenis }) => {
    return (
      <TabunganCard
        tabungan={item}
        onPress={handleTabunganPress}
      />
    );
  };
  
  // Render pagination dots
  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {tabunganList.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.paginationDot,
              index === activeIndex ? styles.paginationDotActive : {}
            ]}
            onPress={() => handleDotPress(index)}
          />
        ))}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#003D82', '#0066CC']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.title}>Rekening Tabungan</Text>
            <Text style={styles.subtitle}>Total Saldo</Text>
            <Text style={styles.totalBalance}>{formatCurrency(totalSaldo)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={onViewAllPress}
          >
            <Text style={styles.viewAllText}>Lihat Semua</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <View style={styles.carouselContainer}>
        {tabunganList.length > 0 ? (
          <>
            <FlatList
              ref={flatListRef}
              data={tabunganList}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_WIDTH + ITEM_SPACING}
              snapToAlignment="center"
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
              onMomentumScrollEnd={handleScroll}
              initialScrollIndex={0}
              getItemLayout={(data, index) => ({
                length: ITEM_WIDTH,
                offset: (ITEM_WIDTH + ITEM_SPACING) * index,
                index,
              })}
            />
            
            {tabunganList.length > 1 && renderPaginationDots()}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Anda belum memiliki rekening tabungan</Text>
            <TouchableOpacity 
              style={styles.newAccountButton}
              onPress={() => router.push('/tabungan/new')}
            >
              <Text style={styles.newAccountButtonText}>Buka Rekening Baru</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerGradient: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  totalBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  viewAllText: {
    color: 'white',
    marginRight: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  carouselContainer: {
    backgroundColor: '#F5F7FA',
    paddingVertical: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  carouselContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCCCCC',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#0066CC',
    width: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  newAccountButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  newAccountButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
});
