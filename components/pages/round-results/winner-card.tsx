import { Button } from "@/components/ui/button";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export default function WinnerCard({
  isDark,
  winner,
  winningCombo,
  popStyle,
  onSaveCombo,
  onShare,
}: {
  isDark: boolean;
  winner: { name: string; avatar?: string } | undefined;
  winningCombo: { id: string; texts: string[] } | undefined;
  popStyle: any;
  onSaveCombo?: (combo: { id: string; texts: string[] }) => void;
  onShare?: (combo: { id: string; texts: string[] }) => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.springify()}
      style={[
        styles.winnerCard,
        { backgroundColor: isDark ? "#151515" : "#FFFFFF" },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={styles.avatar}>{winner?.avatar ?? "🏆"}</Text>
          <View>
            <Text
              style={[styles.winnerName, { color: isDark ? "#fff" : "#111" }]}
            >
              {winner?.name}
            </Text>
            <Text
              style={[styles.subtle, { color: isDark ? "#CFCFCF" : "#666" }]}
            >
              wins the round!
            </Text>
          </View>
        </View>
        <Animated.Text style={[styles.plusOne, popStyle]}>+1</Animated.Text>
      </View>

      <View style={{ marginTop: 10, gap: 6 }}>
        {winningCombo?.texts.map((t, idx) => (
          <Text
            key={idx}
            style={[styles.comboText, { color: isDark ? "#fff" : "#111" }]}
          >
            {winningCombo?.texts.length > 1 ? `${idx + 1}. ` : ""}
            {t}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <Button
          title="Save combo"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onPress={() => {
            if (winningCombo) {
              onSaveCombo?.(winningCombo);
            }
          }}
        />
        <Button
          title="Share"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onPress={() => {
            if (winningCombo) {
              onShare?.(winningCombo);
            }
          }}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  avatar: { fontSize: 22 },
});
