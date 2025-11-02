import { RevealRow } from "@/components/pages/round-results/reveal-row";
import { Button, IconButton } from "@/components/ui/button";
import { useGameStore } from "@/lib/state";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RevealSequenceScreen({
  onFinished,
  onBack,
}: {
  onFinished?: (winnerId?: string) => void; // called after winner highlight shown
  onBack?: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const prompt = useGameStore((state) => state.round?.prompt || "");
  const submissions = useGameStore((state) => state.round?.submissions || []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton variant="ghost" onPress={() => router.back()}>
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
        data={submissions}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 120, gap: 8 }}
        itemLayoutAnimation={LinearTransition.springify()}
        renderItem={({ item, index }) => (
          <RevealRow
            key={item.id}
            item={item}
            visible={item.revealed || false}
            isWinner={false}
            isDark={isDark}
          />
        )}
      />

      {/* Footer controls */}
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => router.navigate("/round-results")}
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
