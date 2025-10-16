import SubmissionCard from "@/components/pages/judges-view/submissions-card";
import { Button, IconButton } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
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
  prompt,
  pickCount = 1,
  submissions,
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
  prompt: string;
  pickCount?: number; // 1 or 2
  submissions: Submission[];
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

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const revealedCount = submissions.filter((s) => s.revealed).length;
  const submittedCount = submissions.length;
  const everyoneSubmitted = submittedCount >= totalPlayers - 1; // judge doesn't submit

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
    onPick?.(id);
  }

  function confirm() {
    if (selectedId) onConfirm?.(selectedId);
  }

  const headerFg = isDark ? "#fff" : "#0B0B0B";

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton variant="ghost" onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={24} color="currentColor" />
        </IconButton>
        <Text style={[styles.title, { color: headerFg }]}>Judge</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <IconButton variant="ghost" onPress={onShuffle}>
            ⟳
          </IconButton>
          <IconButton variant="ghost" onPress={onSkip}>
            ⏭
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
            value={timeLeftSec ?? 0}
            indicatorClassName="bg-purple-400"
          />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Submissions: {submittedCount}/{Math.max(totalPlayers - 1, 0)}
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
            onReveal={() => onReveal?.(item.id)}
            onSelect={() => handleSelect(item.id)}
            pickCount={pickCount}
          />
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Confirm Winner"
          onPress={confirm}
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
