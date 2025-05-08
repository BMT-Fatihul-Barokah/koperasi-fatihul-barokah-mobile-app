import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  useWindowDimensions 
} from 'react-native';

interface PinEntryProps {
  onPinComplete: (pin: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
  pinLength?: number;
  title?: string;
  subtitle?: string;
}

export function PinEntry({
  onPinComplete,
  isLoading = false,
  errorMessage = '',
  pinLength = 4,
  title = 'Masukkan PIN',
  subtitle = 'Masukkan PIN 4 digit Anda'
}: PinEntryProps) {
  const [pin, setPin] = useState<string>('');
  const { width } = useWindowDimensions();
  
  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        // This is just to trigger a re-render to clear the error message visually
        // The actual error message is controlled by the parent component
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  
  // Numeric keypad keys
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  
  // Calculate responsive button size based on screen width
  const buttonSize = Math.min(width * 0.22, 70);
  const buttonMargin = 10;
  
  const handleKeyPress = (key: string) => {
    if (isLoading) return;
    
    if (key === 'del') {
      // Delete the last digit
      if (pin.length > 0) {
        setPin(pin.slice(0, -1));
      }
    } else {
      // Add digit if we have less than pinLength digits
      if (pin.length < pinLength) {
        const newPin = pin + key;
        setPin(newPin);
        
        // Auto-submit when PIN is complete
        if (newPin.length === pinLength) {
          setTimeout(() => {
            onPinComplete(newPin);
          }, 300);
        }
      }
    }
  };
  
  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Memverifikasi PIN...</Text>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>
          
          <View style={styles.pinContainer}>
            {Array.from({ length: pinLength }).map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.pinDot,
                  pin.length > index ? styles.pinDotFilled : {}
                ]}
              />
            ))}
          </View>
          
          <View style={styles.keypadContainer}>
            {keys.map((key, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.keyButton,
                  key === '' && styles.emptyButton,
                  { 
                    width: buttonSize, 
                    height: buttonSize,
                    margin: buttonMargin 
                  }
                ]}
                onPress={() => key && handleKeyPress(key)}
                disabled={key === '' || isLoading}
              >
                {key === 'del' ? (
                  <Text style={styles.deleteButtonText}>⌫</Text>
                ) : (
                  <Text style={styles.keyButtonText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#e53935',
    textAlign: 'center',
    marginTop: 8,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007BFF',
    marginHorizontal: 10,
  },
  pinDotFilled: {
    backgroundColor: '#007BFF',
  },
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  keyButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
  },
  keyButtonText: {
    fontSize: 24,
    fontWeight: '500',
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#666',
  },
  emptyButton: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
