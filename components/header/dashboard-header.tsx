import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  useColorScheme
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DashboardHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightIcon?: {
    name: string;
    onPress: () => void;
    disabled?: boolean;
  };
  rightComponent?: React.ReactNode;
  gradientColors?: string[];
}

export function DashboardHeader({
  title,
  showBackButton = true,
  rightIcon,
  rightComponent,
  gradientColors = ['#003D82', '#0066CC']
}: DashboardHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <>
      <StatusBar style="light" />
      <LinearGradient
        colors={gradientColors as any}
        style={styles.header}
        start={[0, 0]}
        end={[1, 1]}
      >
        <View style={styles.headerContent}>
          {showBackButton ? (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.spacer} />
          )}
          
          <Text style={styles.headerTitle}>{title}</Text>
          
          {rightIcon ? (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={rightIcon.onPress}
              disabled={rightIcon.disabled}
            >
              <Ionicons name={rightIcon.name as any} size={24} color="#fff" />
            </TouchableOpacity>
          ) : rightComponent ? (
            rightComponent
          ) : (
            <View style={styles.spacer} />
          )}
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 40,
    height: 40,
  }
});
