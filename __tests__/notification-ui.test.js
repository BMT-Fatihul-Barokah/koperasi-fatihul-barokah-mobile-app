import React from 'react';
import { render } from '@testing-library/react-native';
import { Ionicons } from '@expo/vector-icons';
import { NOTIFICATION_TYPES } from '../lib/notification.types';

// Mock Ionicons component
jest.mock('@expo/vector-icons', () => {
  const originalModule = jest.requireActual('@expo/vector-icons');
  return {
    ...originalModule,
    Ionicons: jest.fn(({ name, size, color }) => {
      return `Ionicons(${name}, ${size}, ${color})`;
    }),
  };
});

// Mock component to test notification icons
const NotificationIcon = ({ type }) => {
  // Default to info if the type doesn't exist in NOTIFICATION_TYPES
  const typeInfo = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
  
  return (
    <Ionicons 
      name={(typeInfo?.icon || 'information-circle-outline')} 
      size={24} 
      color={typeInfo?.color || '#17a2b8'} 
    />
  );
};

describe('Notification UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should render correct icon for transaction notification types', () => {
    // Test transaction notification types
    const transactionTypes = ['transaksi', 'tabungan_masuk', 'tabungan_keluar', 'pembiayaan_masuk'];
    
    transactionTypes.forEach(type => {
      const { getByText } = render(<NotificationIcon type={type} />);
      
      // Verify the correct icon is used based on the type
      const expectedIcon = NOTIFICATION_TYPES[type].icon;
      const expectedColor = NOTIFICATION_TYPES[type].color;
      
      expect(Ionicons).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expectedIcon,
          color: expectedColor,
          size: 24
        }),
        {}
      );
      
      // Reset mock between renders
      Ionicons.mockClear();
    });
  });
  
  test('should render correct icon for system notification types', () => {
    // Test system notification types
    const systemTypes = ['sistem', 'pengumuman'];
    
    systemTypes.forEach(type => {
      const { getByText } = render(<NotificationIcon type={type} />);
      
      // Verify the correct icon is used based on the type
      const expectedIcon = NOTIFICATION_TYPES[type].icon;
      const expectedColor = NOTIFICATION_TYPES[type].color;
      
      expect(Ionicons).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expectedIcon,
          color: expectedColor,
          size: 24
        }),
        {}
      );
      
      // Reset mock between renders
      Ionicons.mockClear();
    });
  });
  
  test('should render fallback icon for unknown notification type', () => {
    const { getByText } = render(<NotificationIcon type="unknown_type" />);
    
    // Verify fallback to info icon
    const expectedIcon = NOTIFICATION_TYPES.info.icon;
    const expectedColor = NOTIFICATION_TYPES.info.color;
    
    expect(Ionicons).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expectedIcon,
        color: expectedColor,
        size: 24
      }),
      {}
    );
  });
});
