import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Colors from '~/src/Utils/Colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <StatusBar style="inverted" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="deviceDetails" options={{ headerShown: false }} />
          </Stack>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
