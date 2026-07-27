// Powered by OnSpace.AI
import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { WeeklyPlanProvider } from '@/contexts/WeeklyPlanContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <SettingsProvider>
        <WeeklyPlanProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="reader" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="shacharit" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_bottom' }} />
          </Stack>
        </WeeklyPlanProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
