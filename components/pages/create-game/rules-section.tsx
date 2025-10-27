import Counter from "@/components/ui/counter";
import { useGameStore } from "@/lib/state";
import React from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function RulesSection({ isDark }: { isDark: boolean }) {
  const updateSettings = useGameStore((state) => state.updateSettings);
  const roundLimit = useGameStore((state) => state.settings.roundLimit);
  const scoreLimit = useGameStore((state) => state.settings.scoreLimit);
  const handSize = useGameStore((state) => state.settings.handSize);

  return (
    <Animated.View
      entering={FadeInDown.delay(60).springify()}
      style={[styles.card, { backgroundColor: isDark ? "#151515" : "#fff" }]}
    >
      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}>
        Rules
      </Text>
      <Counter
        label="Round limit (0 = unlimited)"
        value={roundLimit}
        setValue={() => {
          updateSettings({ roundLimit });
        }}
        min={0}
        max={30}
        isDark={isDark}
      />
      <Counter
        label="Score limit (0 = unlimited)"
        value={scoreLimit}
        setValue={() => {
          updateSettings({ scoreLimit });
        }}
        min={0}
        max={30}
        isDark={isDark}
      />
      <Counter
        label="Hand size"
        value={handSize}
        setValue={() => updateSettings({ handSize })}
        min={5}
        max={15}
        isDark={isDark}
      />
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
});
