import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { WeeklyPlanProvider } from '@/contexts/WeeklyPlanContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { StatusBar } from 'expo-status-bar';
import { useFonts, FrankRuhlLibre_500Medium, FrankRuhlLibre_700Bold } from '@expo-google-fonts/frank-ruhl-libre';

export default function RootLayout() {
  // Titles fall back to the system font until the serif is loaded.
  useFonts({ FrankRuhlLibre_500Medium, FrankRuhlLibre_700Bold });
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
