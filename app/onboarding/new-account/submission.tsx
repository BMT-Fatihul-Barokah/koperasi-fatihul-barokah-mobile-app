import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SubmissionConfirmationScreen() {
  // Generate a random submission ID
  const submissionId = `REG-${Math.floor(10000 + Math.random() * 90000)}`;
  
  const handleGoToLogin = () => {
    // Navigate back to the main login screen
    router.replace('/');
  };
  
  return (
    <SafeAreaProvider>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        
        <Text style={styles.title}>Application Submitted!</Text>
        <Text style={styles.subtitle}>
          Your account application has been successfully submitted for review.
        </Text>
        
        <View style={styles.submissionIdContainer}>
          <Text style={styles.submissionIdLabel}>Submission ID:</Text>
          <Text style={styles.submissionId}>{submissionId}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Next Steps</Text>
          <Text style={styles.infoText}>
            • Our team will review your application within 1-2 business days
          </Text>
          <Text style={styles.infoText}>
            • You will receive a notification via SMS or WhatsApp about your application status
          </Text>
          <Text style={styles.infoText}>
            • Please visit our office with original documents to complete the registration process
          </Text>
          <Text style={styles.infoText}>
            • Keep your submission ID for reference
          </Text>
        </View>
        
        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            If you have any questions, please contact our customer service:
          </Text>
          <Text style={styles.contactInfo}>Phone: 021-XXXX-XXXX</Text>
          <Text style={styles.contactInfo}>Email: info@bmtfatihulbarokah.com</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.doneButton}
        onPress={handleGoToLogin}
      >
        <Text style={styles.doneButtonText}>Return to Home</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  successIcon: {
    fontSize: 50,
    color: '#fff',
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
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 22,
  },
  submissionIdContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  submissionIdLabel: {
    fontSize: 16,
    color: '#333',
  },
  submissionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    marginBottom: 20,
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
  contactContainer: {
    width: '100%',
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 14,
    color: '#007BFF',
    marginBottom: 5,
  },
  doneButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
