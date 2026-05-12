import "../src/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DatabaseProvider } from "../src/hooks/useDatabase";
import { View, ActivityIndicator, Text } from "react-native";
import { useDatabase } from "../src/hooks/useDatabase";
import { SafeAreaProvider } from "react-native-safe-area-context";

function AppContent({ children }: { children: React.ReactNode }) {
  const { isReady } = useDatabase();

  if (!isReady) {
    return (
      <View className="flex-1 bg-chili-50 items-center justify-center">
        <Text className="text-4xl mb-4">🌶️</Text>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text className="text-gray-500 mt-2">Loading CiliPal...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <AppContent>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="plants/new"
              options={{
                presentation: "modal",
                headerShown: true,
                headerTitle: "New Plant",
                headerTintColor: "#DC2626",
              }}
            />
            <Stack.Screen
              name="plants/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="plants/[id]/edit"
              options={{
                presentation: "modal",
                headerShown: true,
                headerTitle: "Edit Plant",
                headerTintColor: "#DC2626",
              }}
            />
            <Stack.Screen
              name="diary/[id]"
              options={{
                headerShown: true,
                headerTitle: "Photo",
                headerTintColor: "#DC2626",
              }}
            />
            <Stack.Screen
              name="care/log"
              options={{
                presentation: "modal",
                headerShown: true,
                headerTitle: "Log Care",
                headerTintColor: "#DC2626",
              }}
            />
          </Stack>
          <StatusBar style="dark" />
        </AppContent>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
