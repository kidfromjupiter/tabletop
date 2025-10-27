import Header from "@/components/pages/create-game/header";
import HostRoomSection from "@/components/pages/create-game/host-room-section";
import PacksSection from "@/components/pages/create-game/packs-section";
import RulesSection from "@/components/pages/create-game/rules-section";
import { Button } from "@/components/ui/button";
import { useCreateGame } from "@/hooks/useCreateGame";
import { Pack, useGameStore } from "@/lib/state";
import supabase from "@/lib/supabase";
import * as React from "react";
import { ScrollView, StyleSheet, Text, useColorScheme } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateGameScreen({
  onBack,
  defaultName = "",
}: {
  onBack?: () => void;
  defaultName?: string;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [hostName, setHostName] = React.useState(defaultName);
  const { handleStart } = useCreateGame();

  const updateSettings = useGameStore((state) => state.updateSettings);
  const selectedPacks = useGameStore((state) => state.settings.packs);
  const [packs, setPacks] = React.useState<Pack[]>([]); // Properly type `packs`

  React.useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("packs").select("*");
      const mappedPacks = data?.map((pack) => ({
        id: pack.id,
        name: pack.name,
        is_nsfw: pack.is_nsfw,
      }));
      setPacks(mappedPacks || []);
    })();
  }, []);

  // ---------------- Handlers ----------------
  function togglePack(pack: Pack) {
    const isSelected = selectedPacks.some((p) => p.id === pack.id);
    updateSettings({
      packs: isSelected
        ? selectedPacks.filter((p) => p.id !== pack.id)
        : [...selectedPacks, pack],
    });
  }

  function regenerateCode() {
    updateSettings({ roomCode: makeRoomCode() });
  }

  // ---------------- Render ----------------
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      <Header title="Create Game" isDark={isDark} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <HostRoomSection
          hostName={hostName}
          setHostName={setHostName}
          isDark={isDark}
          regenerateCode={regenerateCode}
        />

        {/* Rules */}
        <RulesSection isDark={isDark} />

        {/* Packs */}
        <PacksSection isDark={isDark} packs={packs} togglePack={togglePack} />

        {/* Start */}
        <Animated.View entering={FadeIn.delay(180)}>
          <Button
            title="Start Game"
            variant="primary"
            onPress={async () => await handleStart(hostName)} // Pass hostName explicitly
          />
          <Text
            style={[styles.hint, { color: isDark ? "#9CA3AF" : "#6B7280" }]}
          >
            You can change packs and rules later in Host Controls.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// -------------- Tiny in-file helpers (not exported) --------------
function makeRoomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude I/O/1/0 for readability
  let s = "";
  for (let i = 0; i < 5; i++)
    s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}

// -------------- Styles --------------
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "800" },
  link: { fontSize: 16, textDecorationLine: "underline" },
  card: {
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallButton: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  hint: { textAlign: "center", marginBottom: 16 },
});
