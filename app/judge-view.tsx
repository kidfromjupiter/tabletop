import SubmissionCard from "@/components/pages/judges-view/submissions-card";
import { Button, IconButton } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/constants/supabase";
import { useGameStore } from "@/lib/state";
import { Ionicons } from "@expo/vector-icons";
import { SupabaseClient } from "@supabase/supabase-js";
import { router } from "expo-router";
import * as React from "react";
import { useEffect } from "react";
import { FlatList, StyleSheet, Text, useColorScheme, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * JudgeViewScreen.tsx
 * Card Czar / Judge screen for a CAH-style game.
 * - Shows the black prompt and blind submissions
 * - Tap a card to flip (reveal). Long-press to preview combo vertically
 * - Select a winner and confirm
 * - Host tools: Shuffle / Skip round
 */

export type Submission = {
  id: string;
  texts: string[]; // one or more white card texts (for 2-pick prompts)
  revealed?: boolean;
};

export default function JudgeViewScreen({
  pickCount = 1,
  totalPlayers,
  timeLeftSec,
  timeTotalSec,
  onReveal,
  onRevealAll,
  onPick,
  onConfirm,
  onSkip,
  onShuffle,
  onBack,
}: {
  pickCount?: number; // 1 or 2
  totalPlayers: number;
  timeLeftSec?: number;
  timeTotalSec?: number;
  onReveal?: (id: string) => void;
  onRevealAll?: () => void;
  onPick?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onSkip?: () => void;
  onShuffle?: () => void;
  onBack?: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  //const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const submitForPlayer = useGameStore((state) => state.submitForPlayer);
  const submissions = useGameStore((state) => state.round?.submissions || []);
  const roundId = useGameStore((state) => state.round?.roundId);
  const [prompt, setPrompt] = React.useState("Loading prompt...");
  const [expectedSubmissions, setExpectedSubmissions] = React.useState(0);

  const revealedCount = submissions.filter((s) => s.revealed).length;
  const submittedCount = submissions.length;
  const everyoneSubmitted = submittedCount >= totalPlayers - 1; // judge doesn't submit
  const meId = useGameStore((state) => state.me?.id);

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
    onPick?.(id);
  }

  const headerFg = isDark ? "#fff" : "#0B0B0B";
  const revealCard = async (submission_id: string) => {
    const { data, error } = await supabase.functions.invoke("endpoints", {
      body: {
        action: "reveal_submission",
        payload: {
          round_id: roundId,
          user_id: meId,
          submission_id: submission_id,
        },
      },
    });
  };

  const confirmWinner = async () => {
    if (!selectedId) return;
    const { data, error } = await supabase.functions.invoke("endpoints", {
      body: {
        action: "judge_pick",
        payload: {
          round_id: roundId,
          user_id: meId,
          submission_id: selectedId,
        },
      },
    });
    router.push("/round-results");
  };
  useEffect(() => {
    (async () => {
      const { data: roomState } = await supabase.functions.invoke("endpoints", {
        body: {
          action: "room_state",
          payload: {
            room_code: useGameStore.getState().settings.roomCode,
            user_id: useGameStore.getState().me?.id,
          },
        },
      });
      setPrompt(roomState.round.prompt.text);

      roomState.round.judge_view.map((submission: any) => {
        submitForPlayer({
          id: submission.submission_id,
          texts: submission.cards.map((card: any) => card.text),
          revealed: false,
        });
      });

      setExpectedSubmissions(roomState.round.expected_submissions);
    })();
  }, []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton variant="ghost" onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color="currentColor" />
        </IconButton>
        <Text style={[styles.title, { color: headerFg }]}>Judge</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <IconButton variant="ghost" onPress={onShuffle}>
            <Ionicons name="refresh-sharp" size={24} color="currentColor" />
          </IconButton>
          <IconButton variant="ghost" onPress={onSkip}>
            <Ionicons name="play-forward" size={24} color="currentColor" />
          </IconButton>
        </View>
      </View>

      {/* Prompt (Black Card) */}
      <Animated.View
        entering={FadeInDown.springify()}
        style={[
          styles.promptCard,
          {
            backgroundColor: isDark ? "#111" : "#111",
            borderColor: isDark ? "#2C2C2C" : "#0f0f0f",
          },
        ]}
      >
        <Text style={styles.promptTitle}>
          Prompt {pickCount > 1 ? `(Pick ${pickCount})` : ""}
        </Text>
        <Text style={styles.promptText}>{prompt}</Text>
        <View style={styles.metaRow}>
          <Progress
            value={(submissions.length / expectedSubmissions) * 100}
            indicatorClassName="bg-purple-400"
          />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Submissions: {submittedCount}/{expectedSubmissions}
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>
            Revealed: {revealedCount}/{submittedCount}
          </Text>
        </View>
        {onRevealAll ? (
          <View style={{ marginTop: 8 }}>
            <Button
              title="Reveal all"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={onRevealAll}
            />
          </View>
        ) : null}
      </Animated.View>

      {/* Submissions Grid */}
      <FlatList
        data={submissions}
        keyExtractor={(s) => s.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120, gap: 12 }}
        renderItem={({ item }) => (
          <SubmissionCard
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onReveal={() => revealCard(item.id)}
            onSelect={() => handleSelect(item.id)}
            pickCount={pickCount}
          />
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Confirm Winner"
          onPress={confirmWinner}
          disabled={!selectedId}
        />
      </View>
    </SafeAreaView>
  );
}

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
    borderWidth: 1,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  metaText: { color: "#CFCFCF", fontSize: 12, fontWeight: "600" },
  metaDot: { color: "#777" },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "transparent",
  },
});

/**
 * Usage sample
 * <JudgeViewScreen
 *   prompt={"Why can't I sleep at night?"}
 *   pickCount={1}
 *   submissions=[
 *     { id: 'a', texts: ['A romantic candlelit dinner with homicide.'], revealed: false },
 *     { id: 'b', texts: ['Bees?'], revealed: true },
 *     { id: 'c', texts: ['A mime having a stroke.'], revealed: false },
 *     { id: 'd', texts: ['The miracle of childbirth.'], revealed: true },
 *   ]
 *   totalPlayers={5}
 *   timeLeftSec={20}
 *   timeTotalSec={60}
 *   onReveal={(id)=>{}}
 *   onRevealAll={()=>{}}
 *   onPick={(id)=>{}}
 *   onConfirm={(id)=>{}}
 *   onSkip={()=>{}}
 *   onShuffle={()=>{}}
 *   onBack={()=> navigation.goBack()}
 * />
 */
