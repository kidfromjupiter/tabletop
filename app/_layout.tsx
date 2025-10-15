import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { PortalHost } from "@rn-primitives/portal";
import CreateGameScreen from "./create-game";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* <App /> */}
      {/* <WelcomeScreen
        onCreateGame={() => console.log("Create Game")}
        onJoinGame={() => console.log("Join Game")}
        onPassAndPlay={() => console.log("Pass and Play")}
        onHowToPlay={() => console.log("How to Play")}
      /> */}
      <CreateGameScreen />
      {/* <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack> */}
      <PortalHost />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
