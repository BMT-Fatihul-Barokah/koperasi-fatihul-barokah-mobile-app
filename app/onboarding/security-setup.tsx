import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

interface PinKeypadProps {
  onKeyPress: (key: string) => void;
}

const PinKeypad = ({ onKeyPress }: PinKeypadProps) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  
  return (
    <View style={styles.keypadContainer}>
      {keys.map((key, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.keyButton,
            key === '' && styles.emptyButton,
          ]}
          onPress={() => key && onKeyPress(key)}
          disabled={key === ''}
        >
          {key === 'del' ? (
            <Text style={styles.deleteButtonText}>⌫</Text>
          ) : (
            <Text style={styles.keyButtonText}>{key}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function SecuritySetupScreen() {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  
  const handleKeyPress = (key: string) => {
    if (step === 'create') {
      if (key === 'del') {
        setPin(prev => prev.slice(0, -1));
      } else if (pin.length < 6) {
        setPin(prev => prev + key);
      }
    } else {
      if (key === 'del') {
        setConfirmPin(prev => prev.slice(0, -1));
      } else if (confirmPin.length < 6) {
        setConfirmPin(prev => prev + key);
      }
    }
  };
  
  useEffect(() => {
    if (pin.length === 6 && step === 'create') {
      // Automatically move to confirm step when PIN is complete
      setTimeout(() => {
        setStep('confirm');
      }, 300);
    }
  }, [pin, step]);
  
  useEffect(() => {
    if (confirmPin.length === 6 && step === 'confirm') {
      // Verify PIN match
      if (pin === confirmPin) {
        // In a real app, we would save the PIN securely here
        setTimeout(() => {
          router.push('/onboarding/registration-complete');
        }, 300);
      } else {
        Alert.alert(
          'PIN Tidak Cocok',
          'PIN yang Anda masukkan tidak cocok. Silakan coba lagi.',
          [
            {
              text: 'OK',
              onPress: () => {
                setPin('');
                setConfirmPin('');
                setStep('create');
              },
            },
          ]
        );
      }
    }
  }, [confirmPin, pin, step]);
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan Keamanan</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>
          {step === 'create' ? 'Buat PIN Anda' : 'Konfirmasi PIN Anda'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'create' 
            ? 'Buat PIN 6 digit untuk mengamankan akun Anda'
            : 'Silakan masukkan kembali PIN Anda untuk konfirmasi'
          }
        </Text>
        
        <View style={styles.pinContainer}>
          {Array(6).fill(0).map((_, index) => {
            const currentPin = step === 'create' ? pin : confirmPin;
            const isFilled = index < currentPin.length;
            
            return (
              <View 
                key={index} 
                style={[
                  styles.pinDot,
                  isFilled && styles.pinDotFilled
                ]}
              />
            );
          })}
        </View>
        
        <PinKeypad onKeyPress={handleKeyPress} />
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            PIN Anda akan digunakan untuk mengamankan akun dan mengotorisasi transaksi.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    fontSize: 16,
    color: '#007BFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
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
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pinDotFilled: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  keyButton: {
    width: '30%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  emptyButton: {
    backgroundColor: 'transparent',
  },
  keyButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginTop: 40,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#007BFF',
    textAlign: 'center',
  },
});
