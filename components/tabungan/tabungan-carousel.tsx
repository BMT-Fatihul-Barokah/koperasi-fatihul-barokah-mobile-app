import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, FlatList, NativeSyntheticEvent, NativeScrollEvent, Animated } from 'react-native';
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
const ITEM_WIDTH = width * 0.85; // Make card width relative to screen width
const ITEM_SPACING = 12;

export function TabunganCarousel({ tabunganList, onViewAllPress }: TabunganCarouselProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
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
  
  // Handle scroll to update active index
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!event || !event.nativeEvent) return;
    
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    
    // Calculate the current index based on the scroll position more accurately
    // Using the center of the screen as the reference point
    const centerOfView = contentOffset.x + (viewSize.width / 2);
    const newIndex = Math.round(centerOfView / (ITEM_WIDTH + ITEM_SPACING));
    
    // Ensure the index is within bounds
    const validIndex = Math.max(0, Math.min(newIndex, tabunganList.length - 1));
    
    // Update the active index
    if (validIndex !== activeIndex) {
      setActiveIndex(validIndex);
    }
  }, [activeIndex, tabunganList.length]);
  
  // Scroll to initial index on mount
  useEffect(() => {
    if (flatListRef.current && tabunganList.length > 0) {
      // Small delay to ensure the FlatList is properly rendered
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: false,
        });
      }, 100);
    }
  }, [tabunganList.length]);
  
  // Render carousel item
  const renderCarouselItem = ({ item }: { item: TabunganWithJenis }) => {
    return (
      <View style={styles.cardWrapper}>
        <TabunganCard
          tabungan={item}
          onPress={handleTabunganPress}
          compact={true} // Add compact prop for dashboard view
          showTarget={false} // Don't show target in carousel view to save space
        />
      </View>
    );
  };
  
  // Render animated pagination dots
  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {tabunganList.map((_, index) => {
          // Calculate the input range for the current dot
          const inputRange = [
            (index - 1) * (ITEM_WIDTH + ITEM_SPACING),
            index * (ITEM_WIDTH + ITEM_SPACING),
            (index + 1) * (ITEM_WIDTH + ITEM_SPACING)
          ];
          
          // Animate the width based on scroll position
          const width = scrollX.interpolate({
            inputRange,
            outputRange: [6, 10, 6],
            extrapolate: 'clamp'
          });
          
          // Animate the height based on scroll position
          const height = scrollX.interpolate({
            inputRange,
            outputRange: [6, 10, 6],
            extrapolate: 'clamp'
          });
          
          // Animate the opacity based on scroll position
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp'
          });
          
          // Animate the background color based on scroll position
          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: ['#CCCCCC', '#007BFF', '#CCCCCC'],
            extrapolate: 'clamp'
          });
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
            >
              <Animated.View
                style={[
                  styles.paginationDot,
                  { width, height, opacity, backgroundColor }
                ]}
              />
            </TouchableOpacity>
          );
        })}
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
            <Animated.FlatList
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
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false, listener: handleScroll }
              )}
              onMomentumScrollEnd={handleScroll}
              initialScrollIndex={0}
              getItemLayout={(data, index) => ({
                length: ITEM_WIDTH,
                offset: (ITEM_WIDTH + ITEM_SPACING) * index,
                index,
              })}
              scrollEventThrottle={16} // For smoother animations
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
    paddingVertical: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cardWrapper: {
    width: ITEM_WIDTH,
    marginRight: ITEM_SPACING,
  },
  carouselContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
    height: 20, // Fixed height to prevent layout shifts
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#CCCCCC',
    marginHorizontal: 4,
    overflow: 'hidden', // Ensure animations stay within bounds
  },
  // We'll use animated styles directly instead
  paginationDotActive: {
    backgroundColor: '#007BFF',
    width: 8,
    height: 8,
    borderRadius: 4,
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
