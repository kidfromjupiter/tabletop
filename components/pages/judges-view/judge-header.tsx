import { IconButton } from "@/components/ui/button";
import SharedHeader from "@/components/ui/header";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

export default function JudgeHeader({
  isDark,
  skipPrompt,
}: {
  isDark: boolean;
  skipPrompt: () => void;
}) {
  return (
    <SharedHeader
      title="Judge"
      isDark={isDark}
      left={(<View style={{ width: 44 }} />) as any}
      right={
        <IconButton variant="ghost" onPress={skipPrompt}>
          <Ionicons name="play-forward" size={24} color="currentColor" />
        </IconButton>
      }
    />
  );
}
