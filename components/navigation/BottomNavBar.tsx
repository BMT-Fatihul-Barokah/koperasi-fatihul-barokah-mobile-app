import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  useColorScheme
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavBarProps {
  // Optional custom styles
  style?: object;
}

export function BottomNavBar({ style }: BottomNavBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentPath = usePathname();
  
  // Check if the current path matches or starts with the given path
  const isActive = (path: string) => {
    // Special case for dashboard home
    if (path === '/dashboard' && currentPath === '/dashboard') {
      return true;
    }
    
    // Special case for notifications
    if (path === '/dashboard/notifications' && (currentPath === '/dashboard/notifications' || currentPath === '/notifications' || currentPath.startsWith('/notifications/'))) {
      return true;
    }
    
    // Special case for profile
    if (path === '/dashboard/profile' && (currentPath === '/dashboard/profile' || currentPath === '/profile')) {
      return true;
    }
    
    // For activity and other paths
    if (path === '/activity' && (currentPath === '/activity' || currentPath.startsWith('/activity/'))) {
      return true;
    }
    
    return false;
  };
  
  // Navigation items configuration
  const navItems = [
    {
      name: 'Beranda',
      icon: 'home-outline' as const,
      activeIcon: 'home' as const,
      path: '/dashboard',
    },
    {
      name: 'Aktivitas',
      icon: 'time-outline' as const,
      activeIcon: 'time' as const,
      path: '/activity',
    },
    {
      name: 'Notifikasi',
      icon: 'notifications-outline' as const,
      activeIcon: 'notifications' as const,
      path: '/dashboard/notifications',
      alternatePaths: ['/notifications'],
    },
    {
      name: 'Profil',
      icon: 'person-outline' as const,
      activeIcon: 'person' as const,
      path: '/dashboard/profile',
    },
  ];

  return (
    <View style={[styles.navbar, isDark && styles.navbarDark, style]}>
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <TouchableOpacity 
            key={item.name}
            style={styles.navItem}
            onPress={() => router.push(item.path)}
            activeOpacity={0.7}
          >
            <View style={active ? styles.activeIconContainer : null}>
              <Ionicons 
                name={active ? item.activeIcon : item.icon} 
                size={24} 
                color={active ? (isDark ? '#FFFFFF' : '#007BFF') : (isDark ? '#777777' : '#999999')} 
              />
            </View>
            <Text 
              style={[
                styles.navText, 
                active && styles.activeNavText,
                isDark && styles.navTextDark,
                active && isDark && styles.activeNavTextDark
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navbarDark: {
    backgroundColor: '#1E1E1E',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0.3,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#999999',
  },
  navTextDark: {
    color: '#777777',
  },
  activeNavText: {
    color: '#007BFF',
    fontWeight: '500',
  },
  activeNavTextDark: {
    color: '#FFFFFF',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 20,
    padding: 6,
    marginBottom: -2,
  }
});
