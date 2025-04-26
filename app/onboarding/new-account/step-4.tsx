import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackHeader } from '../../../components/header/back-header';

interface DocumentItem {
  id: string;
  name: string;
  description: string;
  isUploaded: boolean;
}

export default function DocumentUploadScreen() {
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'ktp',
      name: 'KTP (ID Card)',
      description: 'Clear photo of your national ID card',
      isUploaded: false
    },
    {
      id: 'photo',
      name: 'Recent Photo',
      description: 'Clear photo of yourself (3x4)',
      isUploaded: false
    },
    {
      id: 'address',
      name: 'Proof of Address',
      description: 'Utility bill or official letter showing your address',
      isUploaded: false
    }
  ]);

  const handleUpload = (id: string) => {
    // In a real app, this would open the camera or file picker
    // For now, we'll just simulate a successful upload
    
    const updatedDocuments = documents.map(doc => 
      doc.id === id ? { ...doc, isUploaded: true } : doc
    );
    
    setDocuments(updatedDocuments);
    Alert.alert('Success', 'Document uploaded successfully');
  };

  const handleSubmit = () => {
    const allUploaded = documents.every(doc => doc.isUploaded);
    
    if (!allUploaded) {
      Alert.alert('Error', 'Please upload all required documents');
      return;
    }
    
    // In a real app, we would submit the registration form here
    // For now, we'll just navigate to the submission confirmation screen
    router.push('/onboarding/new-account/submission');
  };

  return (
    <SafeAreaProvider>
      <BackHeader title="Document Upload" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(4 / 4) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step 4 of 4</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Upload Required Documents</Text>
        <Text style={styles.subtitle}>
          Please upload clear photos or scans of the following documents
        </Text>
        
        {documents.map((doc) => (
          <View key={doc.id} style={styles.documentCard}>
            <View style={styles.documentInfo}>
              <Text style={styles.documentName}>{doc.name}</Text>
              <Text style={styles.documentDescription}>{doc.description}</Text>
            </View>
            
            {doc.isUploaded ? (
              <View style={styles.uploadedContainer}>
                <View style={styles.checkmarkCircle}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.uploadedText}>Uploaded</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => handleUpload(doc.id)}
              >
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            • All documents must be clear and legible
          </Text>
          <Text style={styles.infoText}>
            • File size should not exceed 5MB per document
          </Text>
          <Text style={styles.infoText}>
            • Supported formats: JPG, PNG, PDF
          </Text>
          <Text style={styles.infoText}>
            • You will need to bring the original documents when visiting our office
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Submit Application</Text>
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
  documentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  documentInfo: {
    flex: 1,
    marginRight: 15,
  },
  documentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
  },
  uploadButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadedContainer: {
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadedText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
