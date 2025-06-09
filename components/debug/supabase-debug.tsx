import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { supabase } from '../../lib/supabase';

/**
 * A debug component for Supabase connection status
 * Only visible in development mode
 */
export function SupabaseDebug() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Check Supabase connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Check Supabase connection
  const checkConnection = async () => {
    try {
      // Check if we can connect to Supabase using a table we know exists
      const { data, error } = await supabase.from('anggota').select('count').limit(1);
      
      if (error) {
        console.error('Supabase connection error:', error);
        setConnectionStatus('error');
        setError(error.message);
        return;
      }
      
      // Get basic connection info
      const projectInfo = {
        connected: true,
        timestamp: new Date().toISOString(),
        url: supabase.supabaseUrl,
        tables: ['anggota', 'akun', 'global_notifikasi', 'global_notifikasi_read', 'transaksi_notifikasi', 'transaksi']
      };
      setProjectInfo(projectInfo);
      
      setConnectionStatus('connected');
    } catch (err) {
      console.error('Error checking Supabase connection:', err);
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // If not in development mode, return null
  if (!__DEV__) return null;

  // Render debug panel
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <TouchableOpacity 
        style={[
          styles.header, 
          connectionStatus === 'connected' ? styles.headerConnected : 
          connectionStatus === 'error' ? styles.headerError : 
          styles.headerChecking
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.headerText}>
          Supabase: {
            connectionStatus === 'connected' ? 'Connected' : 
            connectionStatus === 'error' ? 'Error' : 
            'Checking...'
          }
        </Text>
      </TouchableOpacity>
      
      {isExpanded && (
        <ScrollView style={styles.content}>
          {connectionStatus === 'connected' && (
            <View>
              <Text style={[styles.infoText, isDark && styles.infoTextDark]}>
                Connected to Supabase project
              </Text>
              
              {projectInfo && (
                <View style={styles.infoContainer}>
                  <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Project Info:</Text>
                  <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>
                    {JSON.stringify(projectInfo, null, 2)}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.button}
                onPress={checkConnection}
              >
                <Text style={styles.buttonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {connectionStatus === 'error' && (
            <View>
              <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
                Error connecting to Supabase
              </Text>
              
              {error && (
                <View style={styles.infoContainer}>
                  <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Error:</Text>
                  <Text style={[styles.errorValue, isDark && styles.errorValueDark]}>
                    {error}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.button}
                onPress={checkConnection}
              >
                <Text style={styles.buttonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {connectionStatus === 'checking' && (
            <View>
              <Text style={[styles.infoText, isDark && styles.infoTextDark]}>
                Checking Supabase connection...
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    right: 10,
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  containerDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    borderWidth: 1,
  },
  header: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerConnected: {
    backgroundColor: '#d4edda',
  },
  headerError: {
    backgroundColor: '#f8d7da',
  },
  headerChecking: {
    backgroundColor: '#cce5ff',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    maxHeight: 300,
    padding: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 8,
  },
  infoTextDark: {
    color: '#e0e0e0',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginBottom: 8,
  },
  errorTextDark: {
    color: '#f8d7da',
  },
  infoContainer: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoLabelDark: {
    color: '#e0e0e0',
  },
  infoValue: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: 6,
    borderRadius: 4,
  },
  infoValueDark: {
    color: '#cccccc',
    backgroundColor: '#2a2a2a',
  },
  errorValue: {
    fontSize: 11,
    color: '#dc3545',
    backgroundColor: '#f8f9fa',
    padding: 6,
    borderRadius: 4,
  },
  errorValueDark: {
    color: '#f8d7da',
    backgroundColor: '#2a2a2a',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
