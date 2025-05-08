import { Stack } from 'expo-router';
import { AuthProvider } from '../context/auth-context';
import { DataProvider } from '../context/data-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: colorScheme === 'dark' ? '#121212' : '#FFFFFF',
              },
            }}
          />
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
