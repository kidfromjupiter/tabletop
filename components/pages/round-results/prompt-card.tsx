import React from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function PromptCard({
  isDark,
  prompt,
}: {
  isDark: boolean;
  prompt: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={[styles.promptCard, { backgroundColor: isDark ? "#111" : "#111" }]}
    >
      <Text style={styles.promptTitle}>Prompt</Text>
      <Text style={styles.promptText}>{prompt}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
});
