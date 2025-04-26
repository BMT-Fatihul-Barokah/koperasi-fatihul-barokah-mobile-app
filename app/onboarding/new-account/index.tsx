import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackHeader } from '../../../components/header/back-header';

export default function NewAccountScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      router.push(`/onboarding/new-account/step-${currentStep + 1}`);
    }
  };

  return (
    <SafeAreaProvider>
      <BackHeader title="New Account Registration" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to BMT Fatihul Barokah</Text>
        <Text style={styles.subtitle}>
          Complete the registration process to open a new account with our cooperative.
        </Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Before You Begin</Text>
          <Text style={styles.infoText}>
            • You will need to provide personal information
          </Text>
          <Text style={styles.infoText}>
            • Have your ID card ready for verification
          </Text>
          <Text style={styles.infoText}>
            • You will need to visit our office to finalize your account
          </Text>
          <Text style={styles.infoText}>
            • The registration process takes approximately 5-10 minutes
          </Text>
        </View>
        
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Registration Steps</Text>
          
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, styles.stepNumberActive]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Personal Information</Text>
              <Text style={styles.stepDescription}>Basic details and contact information</Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Address & Employment</Text>
              <Text style={styles.stepDescription}>Your address and employment details</Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Account Selection</Text>
              <Text style={styles.stepDescription}>Choose your account type and services</Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Document Upload</Text>
              <Text style={styles.stepDescription}>Upload required documents for verification</Text>
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.nextButton}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>Begin Registration</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  contentContainer: {
    flexGrow: 1,
  },
  progressContainer: {
    marginBottom: 25,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007BFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    lineHeight: 22,
  },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 25,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  stepsContainer: {
    marginBottom: 30,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  stepNumberActive: {
    backgroundColor: '#007BFF',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
