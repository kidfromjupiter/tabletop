import { IconButton } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function JudgeHeader({
  isDark,
  skipPrompt,
}: {
  isDark: boolean;
  skipPrompt: () => void;
}) {
  const headerFg = isDark ? "#fff" : "#0B0B0B";

  return (
    <View style={[styles.header]}>
      <View style={{ width: 44 }} />
      <Text style={[styles.title, { color: headerFg }]}>Judge</Text>
      <IconButton variant="ghost" onPress={skipPrompt}>
        <Ionicons name="play-forward" size={24} color="currentColor" />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "800" },
});
