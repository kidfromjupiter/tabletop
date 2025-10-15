import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function Toggle({
  label,
  value,
  onToggle,
  isDark,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.toggleRow,
        {
          backgroundColor: isDark ? "#1E1E1E" : "#F3F3F4",
          borderColor: isDark ? "#2C2C2C" : "#E4E4E7",
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text
        style={[styles.label, { flex: 1, color: isDark ? "#EDEDED" : "#333" }]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.switch,
          {
            backgroundColor: value
              ? isDark
                ? "#8B7BFF"
                : "#6A5AE0"
              : isDark
                ? "#2A2A2A"
                : "#E5E7EB",
          },
        ]}
      >
        <View
          style={[
            styles.knob,
            {
              transform: [{ translateX: value ? 16 : 0 }],
              backgroundColor: isDark ? "#0B0B0B" : "#fff",
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    flex: 1,
    marginTop: 6,
  },
  switch: {
    width: 36,
    height: 22,
    borderRadius: 999,
    padding: 3,
    justifyContent: "center",
  },
  knob: {
    width: 16,
    height: 16,
    borderRadius: 16,
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 0 },
});
