import * as React from "react";
import { FlatList, StyleSheet, Text, useColorScheme, View } from "react-native";
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
//import { Button, IconButton } from "./ui.buttons";
import PromptCard from "@/components/pages/round-results/prompt-card";
import RoundResultsHeader from "@/components/pages/round-results/round-results-header";
import WinnerCard from "@/components/pages/round-results/winner-card";
import { Button } from "@/components/ui/button";
import { useRoundResults } from "@/hooks/useRoundResults";
import supabase from "@/lib/supabase";
import { router } from "expo-router";

/**
 * RevealAndResultsScreens.tsx
 * Two screens:
 * 1) RevealSequenceScreen — dramatic reveal of all submissions, then winner highlight.
 * 2) RoundResultsScreen — round summary, points update, mini-scoreboard, next actions.
 */

// ---------------- Types ----------------
export type Combo = { id: string; texts: string[] };
export type RevealItem = {
  id: string;
  texts: string[];
  isWinner?: boolean;
  visible?: boolean;
};
export type ScoreEntry = {
  id: string;
  name: string;
  score: number;
  avatar?: string;
};
// =============== 2) RoundResultsScreen ===============
export default function RoundResultsScreen({
  scoreboard,
  onNextRound,
  onSaveCombo,
  onShare,
  onBackToLobby,
}: {
  scoreboard: ScoreEntry[]; // already sorted desc
  onNextRound?: () => void;
  onSaveCombo?: (combo: Combo) => void;
  onShare?: (combo: Combo) => void;
  onBackToLobby?: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { roomCode, meId, players, prompt, winner, winningCombo } =
    useRoundResults();

  // Small number pop for +1 point near winner row
  const pop = useSharedValue(0);
  React.useEffect(() => {
    pop.value = 0;
    pop.value = withDelay(350, withTiming(1, { duration: 500 }));
  }, [winningCombo?.id]);
  const popStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ translateY: interpolate(pop.value, [0, 1], [10, 0]) }],
  }));

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      {/* Header */}
      <RoundResultsHeader isDark={isDark} />

      {/* Prompt */}
      <PromptCard isDark={isDark} prompt={prompt} />

      {/* Winner block */}
      <WinnerCard
        isDark={isDark}
        winner={winner}
        winningCombo={winningCombo}
        popStyle={popStyle}
        onSaveCombo={onSaveCombo}
        onShare={onShare}
      />

      {/* Scoreboard */}
      <Animated.View
        entering={FadeInDown.delay(60).springify()}
        style={[
          styles.sectionCard,
          { backgroundColor: isDark ? "#151515" : "#FFFFFF" },
        ]}
      >
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Scoreboard
        </Text>
        <FlatList
          data={players}
          keyExtractor={(s) => s.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View
              style={[
                styles.scoreRow,
                { borderColor: isDark ? "#2C2C2C" : "#E5E7EB" },
              ]}
            >
              <Text style={styles.avatar}>{item.avatar ?? "🙂"}</Text>
              <Text
                style={[styles.scoreName, { color: isDark ? "#fff" : "#111" }]}
              >
                {item.name}
              </Text>
              <View style={{ flex: 1 }} />
              <Text
                style={[styles.scoreVal, { color: isDark ? "#fff" : "#111" }]}
              >
                {item.score}
              </Text>
            </View>
          )}
        />
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Next Round"
          onPress={async () => {
            await supabase.functions.invoke("endpoints", {
              body: {
                action: "toggle_ready",
                payload: {
                  user_id: meId,
                  room_code: roomCode,
                  is_ready: true,
                },
              },
            });
            router.push("/lobby");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "800" },

  promptCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
  },
  promptTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  promptText: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 6 },

  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16 },

  // Reveal rows
  hiddenRow: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 0,
    marginHorizontal: 4,
  },
  revealRow: {
    padding: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  revealText: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  winnerBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#10B981",
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  // Winner card & scoreboard
  winnerCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
  },
  winnerName: { fontSize: 18, fontWeight: "900" },
  plusOne: { fontSize: 20, fontWeight: "900", color: "#22C55E" },
  subtle: { fontSize: 12 },
  comboText: { fontSize: 15, fontWeight: "700", lineHeight: 20 },

  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: { fontSize: 22 },
  scoreName: { fontSize: 16, fontWeight: "700" },
  scoreVal: {
    fontSize: 16,
    fontWeight: "900",
    minWidth: 28,
    textAlign: "right",
  },
  gradientBorder: {
    overflow: "hidden",
    padding: 4, // border thickness
    borderRadius: 14,
    marginHorizontal: 12,
    position: "relative",
  },
  revealRowInner: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  gradientFill: {
    opacity: 1, // animated via styles above
  },
  glowShadow: {
    position: "absolute",
    left: 6,
    right: 6,
    top: -2,
    bottom: -2,
    borderRadius: 18,
  },
});
