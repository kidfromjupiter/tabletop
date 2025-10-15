import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

export function Tag({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: isDark ? "#222" : "#F3F4F6",
      }}
    >
      <Text style={{ fontSize: 12, color: isDark ? "#EDEDED" : "#333" }}>
        {children}
      </Text>
    </View>
  );
}

export function PackTag({ label }: { label: string }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isDark ? "#2C2C2C" : "#E5E7EB",
        backgroundColor: isDark ? "#1C1C1C" : "#FFFFFF",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: isDark ? "#EDEDED" : "#111",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
