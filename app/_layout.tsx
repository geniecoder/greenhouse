import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { palettes } from '@/src/ui/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const backgroundColor = palettes[scheme === 'dark' ? 'dark' : 'light'].background;

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
