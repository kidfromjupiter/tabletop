import { IconButton } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Header({
  title,
  isDark,
}: {
  title: string;
  isDark: boolean;
}) {
  const router = useRouter();
  const headerFg = isDark ? "#fff" : "#0B0B0B";

  return (
    <View style={styles.header}>
      <IconButton
        variant="ghost"
        onPress={() => {
          router.back();
        }}
      >
        <Ionicons name="arrow-back-outline" size={24} color="currentColor" />
      </IconButton>
      <Text style={[styles.title, { color: headerFg }]}>{title}</Text>
      <View style={{ width: 44 }} />
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
