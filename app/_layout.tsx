import { Stack } from 'expo-router';
import { AuthProvider } from '../context/auth-context';
import { DataProvider } from '../context/data-context';
import { QueryProvider } from '../context/query-provider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <DataProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: colorScheme === 'dark' ? '#121212' : '#FFFFFF',
                },
                animation: 'none', // Disable animations completely
                // You can also use 'fade' or 'slide_from_right' for simpler transitions
              }}
            />
          </DataProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
