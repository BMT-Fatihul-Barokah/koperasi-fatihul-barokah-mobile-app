import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.imageContainer}>
        {/* Placeholder for illustration - replace with actual image */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>Logo Aplikasi</Text>
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Selamat Datang di BMT Fatihul Barokah</Text>
        <Text style={styles.subtitle}>
          Kelola tabungan, pembiayaan, dan informasi keuangan Anda dengan mudah
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/onboarding/phone-verification')}
      >
        <Text style={styles.buttonText}>Lanjutkan</Text>
      </TouchableOpacity>
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
  imagePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 18,
    color: '#888',
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
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignSelf: 'stretch',
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
