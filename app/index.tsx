import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Logo from '../assets/logo.svg';
import { PrimaryButton } from '../components/buttons/primary-button';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.imageContainer}>
      <Logo 
           width={300}
           height={300}
           style={styles.logo} 
         />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Selamat Datang di BMT Fatihul Barokah</Text>
        <Text style={styles.subtitle}>
          Kelola tabungan, pembiayaan, dan informasi keuangan Anda dengan mudah
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <PrimaryButton 
          label="Lanjutkan"
          onPress={() => router.push('/onboarding/phone-verification')}
        />
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
  imageContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginBottom: 20
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
});
