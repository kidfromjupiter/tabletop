import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack, useRouter } from "expo-router";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  //const navigation = useNavigation();
  const router = useRouter();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: "#F6F6F8" },
          headerTintColor: "#111",
          freezeOnBlur: true,
        }}
      >
        <Stack.Screen
          name="welcome"
          options={{ title: "Welcome" }}
          initialParams={{
            appName: "Tabletop Party",
            tagline: "A terrible game for terribly funny people.",
          }}
        />
        <Stack.Screen
          name="player-view"
          options={{ title: "Game" }}
          initialParams={{
            roomCode: "ABCD5",
            playerId: "p1",
          }}
        />
        <Stack.Screen
          name="round-results"
          options={{ title: "Round Results" }}
          initialParams={{
            prompt: "Why can't I sleep at night?",
            winner: { id: "p3", name: "Alex", avatar: "😎" },
            winningCombo: { id: "c", texts: ["A mime having a stroke."] },
            scoreboard: [
              { id: "p3", name: "Alex", score: 3 },
              { id: "p1", name: "Kavi", score: 2 },
              { id: "p2", name: "Zee", score: 1 },
            ],
            onCreateGame: () => router.push("/create-game"),
            onJoinGame: () => {
              console.log("Clicked join game");
              router.push("/join-game");
            },
          }}
        />
        <Stack.Screen
          name="reveal-sequence"
          options={{ title: "Reveal Sequence" }}
          initialParams={{
            prompt: "Why can't I sleep at night?",
            items: [
              {
                id: "a",
                texts: ["A romantic candlelit dinner with homicide."],
              },
              { id: "b", texts: ["Bees?"] },
              { id: "c", texts: ["A mime having a stroke."], isWinner: true },
            ],
          }}
        />
        <Stack.Screen
          name="judge-view"
          options={{ title: "Judge View" }}
          initialParams={{
            prompt: "Why can't I sleep at night?",
            pickCount: 1,
            submissions: [
              {
                id: "a",
                texts: ["A romantic candlelit dinner with homicide."],
                revealed: false,
              },
              { id: "b", texts: ["Bees?"], revealed: true },
              { id: "c", texts: ["A mime having a stroke."], revealed: false },
              {
                id: "d",
                texts: ["The miracle of childbirth."],
                revealed: true,
              },
            ],
            totalPlayers: 5,
            timeLeftSec: 20,
            timeTotalSec: 60,
          }}
        />
        <Stack.Screen
          name="lobby"
          options={{ title: "Lobby" }}
          initialParams={{
            isHost: true,
            players: [
              { id: "1", name: "Kavi", isHost: true, isReady: true },
              { id: "2", name: "Alex", isReady: false },
            ],
            meId: "1",
            settings: {
              roomCode: "ABCD5",
              isPrivate: true,
              familyMode: false,
              roundLimit: 8,
              scoreLimit: 10,
              handSize: 10,
              packs: ["Base", "Party"],
            },
          }}
        />
        <Stack.Screen
          name="create-game"
          options={{ title: "Create Game" }}
          initialParams={{ defaultName: "" }}
        />
        <Stack.Screen
          name="join-game"
          options={{ title: "Join Game" }}
          initialParams={{
            defaultName: "Alex",
            lastSession: { roomCode: "ABCD5", name: "Alex" },
          }}
        />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
