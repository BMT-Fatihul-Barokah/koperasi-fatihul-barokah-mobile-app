import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackHeader } from '../../../components/header/back-header';

interface AccountType {
  id: string;
  name: string;
  description: string;
  features: string[];
}

export default function AccountSelectionScreen() {
  const accountTypes: AccountType[] = [
    {
      id: 'savings',
      name: 'Tabungan Reguler',
      description: 'Standard savings account with easy access to your funds',
      features: [
        'No minimum balance requirements',
        'Free cash withdrawals at our office',
        'Monthly account statements',
        'Access to mobile banking'
      ]
    },
    {
      id: 'investment',
      name: 'Tabungan Investasi',
      description: 'Higher return savings account for long-term financial goals',
      features: [
        'Competitive profit sharing rates',
        'Minimum balance requirements apply',
        'Term options from 3 to 36 months',
        'Early withdrawal penalties may apply'
      ]
    },
    {
      id: 'hajj',
      name: 'Tabungan Haji & Umrah',
      description: 'Special savings account for Hajj and Umrah preparation',
      features: [
        'Dedicated savings for Hajj and Umrah expenses',
        'Competitive profit sharing rates',
        'Free Hajj registration assistance',
        'Special Hajj preparation programs'
      ]
    }
  ];

  const [selectedAccountType, setSelectedAccountType] = useState<string | null>(null);

  const handleNext = () => {
    if (!selectedAccountType) {
      Alert.alert('Error', 'Please select an account type');
      return;
    }

    // Navigate to the next step
    router.push('/onboarding/new-account/step-4');
  };

  return (
    <SafeAreaProvider>
      <BackHeader title="Account Selection" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(3 / 4) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step 3 of 4</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Select Account Type</Text>
        <Text style={styles.subtitle}>
          Choose the account type that best fits your financial needs
        </Text>
        
        {accountTypes.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={[
              styles.accountCard,
              selectedAccountType === account.id && styles.accountCardSelected
            ]}
            onPress={() => setSelectedAccountType(account.id)}
          >
            <View style={styles.accountHeader}>
              <Text style={styles.accountName}>{account.name}</Text>
              <View style={[
                styles.radioButton,
                selectedAccountType === account.id && styles.radioButtonSelected
              ]}>
                {selectedAccountType === account.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
            
            <Text style={styles.accountDescription}>{account.description}</Text>
            
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Features:</Text>
              {account.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            You can discuss additional account options and features when you visit our office to finalize your registration.
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
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
  },
  accountCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  accountCardSelected: {
    borderColor: '#007BFF',
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007BFF',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007BFF',
  },
  accountDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  featuresContainer: {
    marginTop: 5,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 5,
  },
  featureBullet: {
    fontSize: 14,
    color: '#007BFF',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#007BFF',
  },
  buttonContainer: {
    marginTop: 20,
  },
  nextButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
