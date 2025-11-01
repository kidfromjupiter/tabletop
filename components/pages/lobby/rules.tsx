import { GameSettings } from "@/lib/state";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { PackTag } from "./tags";

export default function Rules({
  settings,
  isDark,
  headerFg,
  onToggleFamilyMode,
}: {
  settings: GameSettings;
  isDark: boolean;
  headerFg: string;
  onToggleFamilyMode?: (value: boolean) => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.springify()}
      style={[
        styles.sectionCard,
        { backgroundColor: isDark ? "#151515" : "#fff" },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: headerFg }]}>Rules</Text>
      <View style={styles.ruleRow}>
        <Text style={styles.ruleKey}>Round limit</Text>
        <Text style={styles.ruleVal}>{settings.roundLimit || "∞"}</Text>
      </View>
      <View style={styles.ruleRow}>
        <Text style={styles.ruleKey}>Score limit</Text>
        <Text style={styles.ruleVal}>{settings.scoreLimit || "∞"}</Text>
      </View>
      <View style={styles.ruleRow}>
        <Text style={styles.ruleKey}>Hand size</Text>
        <Text style={styles.ruleVal}>{settings.handSize}</Text>
      </View>
      {/* <View style={[styles.ruleRow, { alignItems: "center" }]}>
        <Text style={styles.ruleKey}>Family mode</Text>
        <Switch
          value={settings.familyMode}
          onValueChange={onToggleFamilyMode}
          trackColor={{
            false: isDark ? "#2A2A2A" : "#E5E7EB",
            true: isDark ? "#8B7BFF" : "#6A5AE0",
          }}
          thumbColor={isDark ? "#0B0B0B" : "#FFF"}
          ios_backgroundColor={isDark ? "#2A2A2A" : "#E5E7EB"}
        />
      </View> */}

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 20,
        }}
      >
        {settings.packs.map((p) => (
          <PackTag key={p.id} label={p.name} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  ruleKey: { fontSize: 14, fontWeight: "600", opacity: 0.9, color: "white" },
  ruleVal: { fontSize: 14, fontWeight: "700", color: "white" },
});
