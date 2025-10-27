import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function PromptCard({
  isDark,
  pickCount,
  prompt,
  submissions,
  expectedSubmissions,
  revealedCount,
  onRevealAll,
}: {
  isDark: boolean;
  pickCount: number;
  prompt: string;
  submissions: any[];
  expectedSubmissions: number;
  revealedCount: number;
  onRevealAll?: () => void;
}) {
  return (
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
          Submissions: {submissions.length}/{expectedSubmissions}
        </Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>
          Revealed: {revealedCount}/{submissions.length}
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
  );
}

const styles = StyleSheet.create({
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
});
