import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";

export const unstable_settings = {
  anchor: "welcome",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: "#F6F6F8" },
          headerTintColor: "#111",
        }}
      >
        <Stack.Screen name="welcome" options={{ title: "Welcome" }} />
        <Stack.Screen
          name="round-results"
          options={{ title: "Round Results" }}
        />
        <Stack.Screen
          name="reveal-sequence"
          options={{ title: "Reveal Sequence" }}
        />
        <Stack.Screen name="judge-view" options={{ title: "Judge View" }} />
        <Stack.Screen name="lobby" options={{ title: "Lobby" }} />
        <Stack.Screen name="create-game" options={{ title: "Create Game" }} />
      </Stack>

      <PortalHost />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
