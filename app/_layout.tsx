import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { PortalHost } from "@rn-primitives/portal";
import JudgeViewScreen from "./judge-view";

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

      <JudgeViewScreen
        prompt={"Why can't I sleep at night?"}
        pickCount={1}
        submissions={[
          {
            id: "a",
            texts: ["A romantic candlelit dinner with homicide."],
            revealed: false,
          },
          { id: "b", texts: ["Bees?"], revealed: true },
          { id: "c", texts: ["A mime having a stroke."], revealed: true },
          { id: "d", texts: ["The miracle of childbirth."], revealed: true },
        ]}
        totalPlayers={5}
        timeLeftSec={20}
        timeTotalSec={60}
        onReveal={(id) => {}}
        onRevealAll={() => {}}
        onPick={(id) => {}}
        onConfirm={(id) => {}}
        onSkip={() => {}}
        onShuffle={() => {}}
        // onBack={()=> navigation.goBack()}
      />
      {/* <LobbyScreen
        isHost={true}
        players={[
          { id: "1", name: "Kavi", isHost: true, isReady: true },
          { id: "2", name: "Alex", isReady: false },
        ]}
        meId={"1"}
        settings={{
          roomCode: "ABCD5",
          isPrivate: true,
          familyMode: false,
          roundLimit: 8,
          scoreLimit: 10,
          handSize: 10,
          packs: ["Base", "Party"],
        }}
        //  onStart={() => navigation.navigate('Round')}
        onToggleReady={(id) => {}}
        onKick={(id) => {}}
        onPromote={(id) => {}}
        onShuffleJudges={() => {}}
        onCopyInvite={() => {}}
        //onLeave={()=> navigation.goBack()}
        onToggleFamilyMode={(v) => {}}
      /> */}
      {/* <CreateGameScreen /> */}
      {/* <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack> */}
      <PortalHost />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
