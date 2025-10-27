import { useGameStore } from "@/lib/state";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function PacksSection({
  isDark,
  packs,
  togglePack,
}: {
  isDark: boolean;
  packs: { id: string; name: string; is_nsfw: boolean }[];
  togglePack: (pack: { id: string; name: string; is_nsfw: boolean }) => void;
}) {
  const selectedPacks = useGameStore((state) => state.settings.packs);
  const familyMode = useGameStore((state) => state.settings.familyMode);

  return (
    <Animated.View
      entering={FadeInDown.delay(120).springify()}
      style={[styles.card, { backgroundColor: isDark ? "#151515" : "#fff" }]}
    >
      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}>
        Packs
      </Text>
      <View style={styles.chipsWrap}>
        {packs.map((p) => {
          const active = selectedPacks.some((sp) => sp.id === p.id);
          return (
            <Pressable
              key={p.id}
              onPress={() => togglePack(p)}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? isDark
                      ? "#8B7BFF"
                      : "#6A5AE0"
                    : isDark
                      ? "#222"
                      : "#F1F1F3",
                  borderColor: isDark ? "#2C2C2C" : "#E4E4E7",
                  opacity: active ? 1 : 0.5,
                },
              ]}
            >
              <Text
                style={{
                  color: active
                    ? isDark
                      ? "#0B0B0B"
                      : "#fff"
                    : isDark
                      ? "#EDEDED"
                      : "#222",
                  fontWeight: "600",
                }}
              >
                {p.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {familyMode && selectedPacks.some((p) => p.is_nsfw) && (
        <Text style={{ color: isDark ? "#F1C40F" : "#8a6d3b", marginTop: 6 }}>
          Family mode is on: NSFW pack will be disabled at start.
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
});
