import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface RightIconProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface StandardHeaderProps {
  title: string;
  showBackButton?: boolean;
  useGradient?: boolean;
  rightIcon?: RightIconProps;
  rightComponent?: React.ReactNode;
}

export function StandardHeader({
  title,
  showBackButton = true,
  useGradient = false,
  rightIcon,
  rightComponent
}: StandardHeaderProps) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  
  // Handle back button press
  const handleBackPress = () => {
    router.back();
  };
  
  return (
    <>
      {useGradient ? (
        <LinearGradient
          colors={['#007BFF', '#0056b3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <View style={styles.leftSection}>
              {showBackButton && (
                <TouchableOpacity 
                  onPress={handleBackPress} 
                  style={styles.backButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={24} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              )}
              <Text style={[styles.title, styles.titleLight]}>
                {title}
              </Text>
            </View>
            
            <View style={styles.rightSection}>
              {rightIcon && (
                <TouchableOpacity 
                  onPress={rightIcon.onPress}
                  style={styles.rightIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name={rightIcon.name} 
                    size={24} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              )}
              {rightComponent}
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.headerContainer, isDark ? styles.headerContainerDark : styles.headerContainerLight]}>
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <View style={styles.leftSection}>
              {showBackButton && (
                <TouchableOpacity 
                  onPress={handleBackPress} 
                  style={styles.backButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={24} 
                    color={isDark ? '#fff' : '#007BFF'} 
                  />
                </TouchableOpacity>
              )}
              <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}>
                {title}
              </Text>
            </View>
            
            <View style={styles.rightSection}>
              {rightIcon && (
                <TouchableOpacity 
                  onPress={rightIcon.onPress}
                  style={styles.rightIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name={rightIcon.name} 
                    size={24} 
                    color={isDark ? '#fff' : '#007BFF'} 
                  />
                </TouchableOpacity>
              )}
              {rightComponent}
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
  },
  headerContainerLight: {
    backgroundColor: '#ffffff',
  },
  headerContainerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  titleLight: {
    color: '#007BFF',
  },
  titleDark: {
    color: '#ffffff',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightIcon: {
    marginLeft: 16,
  },
});
