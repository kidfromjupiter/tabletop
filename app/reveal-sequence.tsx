import type { RevealItem } from "@/app/round-results";
import { RevealRow } from "@/components/pages/round-results/reveal-row";
import { Button, IconButton } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RevealSequenceScreen({
  prompt,
  items,
  autoPlay = true,
  autoDelayMs = 900,
  onFinished,
  onBack,
}: {
  prompt: string;
  items: RevealItem[]; // order of reveal (already shuffled)
  autoPlay?: boolean;
  autoDelayMs?: number;
  onFinished?: (winnerId?: string) => void; // called after winner highlight shown
  onBack?: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [step, setStep] = React.useState(0); // index of the last revealed item (inclusive)
  const [done, setDone] = React.useState(false);

  const winner = items.find((i) => i.isWinner);

  // Autoplay reveal
  React.useEffect(() => {
    if (!autoPlay) return;
    if (done) return;
    if (step >= items.length - 1) return; // last item already revealed
    const t = setTimeout(
      () => setStep((s) => Math.min(s + 1, items.length - 1)),
      autoDelayMs
    );
    return () => clearTimeout(t);
  }, [step, autoPlay, autoDelayMs, done, items.length]);

  // Once all revealed, show a brief winner highlight then finish
  React.useEffect(() => {
    if (step >= items.length - 1 && !done) {
      const t = setTimeout(() => {
        setDone(true);
        onFinished?.(winner?.id);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [step, items.length, done, onFinished, winner?.id]);

  function revealNext() {
    if (done) return;
    setStep((s) => Math.min(s + 1, items.length - 1));
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton variant="ghost" onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={24} color="currentColor" />
        </IconButton>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]}>
          Reveal
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Prompt */}
      <Animated.View
        entering={FadeInDown.springify()}
        style={[
          styles.promptCard,
          { backgroundColor: isDark ? "#111" : "#111" },
        ]}
      >
        <Text style={styles.promptTitle}>Prompt</Text>
        <Text style={styles.promptText}>{prompt}</Text>
      </Animated.View>

      {/* Reveal list */}
      <Animated.FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 120, gap: 12 }}
        itemLayoutAnimation={LinearTransition.springify()}
        renderItem={({ item, index }) => (
          <RevealRow
            key={item.id}
            item={item}
            visible={index <= step}
            isWinner={!!item.isWinner && step >= items.length - 1}
            isDark={isDark}
          />
        )}
      />

      {/* Footer controls */}
      <View style={styles.footer}>
        {!done && step < items.length - 1 ? (
          <Button title="Reveal Next" onPress={revealNext} />
        ) : (
          <Button title="Continue" onPress={() => onFinished?.(winner?.id)} />
        )}
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
});
