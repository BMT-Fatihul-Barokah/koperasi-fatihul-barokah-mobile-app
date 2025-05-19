import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface BackHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

export function BackHeader({ title, onBackPress, rightComponent }: BackHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        paddingTop: insets.top > 0 ? Math.min(insets.top + 4, 16) : 8,
        backgroundColor: isDark ? '#1a1a1a' : '#fff',
        borderBottomColor: isDark ? '#333' : '#f0f0f0' 
      }
    ]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#1a1a1a" : "#fff"} />
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBackPress}
      >
        <Ionicons name="chevron-back" size={24} color={isDark ? "#fff" : "#000"} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      {rightComponent && (
        <View style={styles.rightComponentContainer}>
          {rightComponent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    height: 56, // Fixed height for consistency
  },
  backButton: {
    padding: 8,
    marginLeft: -8, // Negative margin to align with content
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center', // Center the title
  },
  rightComponentContainer: {
    marginLeft: 'auto',
  },
});
