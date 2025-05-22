import { Stack } from 'expo-router';
import { AuthProvider } from '../context/auth-context';
import { DataProvider } from '../context/data-context';
import { QueryProvider } from '../context/query-provider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, LogBox } from 'react-native';
import { ErrorBoundary } from '../components/error-boundary';

// Ignore specific warnings that might be causing issues
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'Sending `onAnimatedValueUpdate`',
  'Non-serializable values were found in the navigation state',
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
