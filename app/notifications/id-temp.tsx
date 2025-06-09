import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StandardHeader } from '../../components/header/standard-header';
import { useAuth } from '../../context/auth-context';
import { useData } from '../../context/data-context';
import { NotificationService } from '../../services/notification.service';

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams();
  const notificationId = id ? String(id) : '';
  const { member } = useAuth();
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notification details
  useEffect(() => {
    if (!notificationId || !member?.id) return;

    async function fetchNotification() {
      try {
        setIsLoading(true);
        const notifications = await NotificationService.getNotifications(member.id);
        const found = notifications.find(n => n.id === notificationId);
        
        if (found) {
          setNotification(found);
        } else {
          setError('Notification not found');
        }
      } catch (err) {
        setError('Failed to load notification');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotification();
  }, [notificationId, member?.id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StandardHeader title="Detail Notifikasi" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !notification) {
    return (
      <SafeAreaView style={styles.container}>
        <StandardHeader title="Detail Notifikasi" showBackButton />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
          <Text style={styles.errorText}>{error || 'Notification not found'}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StandardHeader title="Detail Notifikasi" showBackButton />
      <ScrollView style={styles.scrollView}>
        <View style={styles.card}>
          <Text style={styles.title}>{notification.title || notification.judul}</Text>
          <Text style={styles.date}>{new Date(notification.created_at).toLocaleDateString('id-ID')}</Text>
          <View style={styles.divider} />
          <Text style={styles.message}>{notification.message || notification.pesan}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
