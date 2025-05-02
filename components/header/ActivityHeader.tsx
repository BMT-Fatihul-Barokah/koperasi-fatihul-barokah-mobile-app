import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  StatusBar as RNStatusBar
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityHeaderProps {
  title: string;
  showBackButton?: boolean;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  rightComponent?: React.ReactNode;
}

export function ActivityHeader({
  title,
  showBackButton = false,
  showFilterButton = false,
  onFilterPress,
  rightComponent
}: ActivityHeaderProps) {
  return (
    <>
      <StatusBar style="light" />
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        {showFilterButton ? (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={onFilterPress}
          >
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
        ) : rightComponent ? (
          rightComponent
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#007BFF',
    paddingTop: RNStatusBar.currentHeight ? RNStatusBar.currentHeight + 10 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
  backButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  iconText: {
    fontSize: 20,
    color: '#fff',
  },
  spacer: {
    width: 40,
  }
});
