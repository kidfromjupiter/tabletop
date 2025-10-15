import { Button, IconButton } from "@/components/ui/button";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInUp,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

export default function PlayerCard({
  item,
  isDark,
  meId,
  isHost,
  onToggleReady,
  onPromote,
  onKick,
}: {
  item: {
    id: string;
    name: string;
    isHost?: boolean;
    isReady?: boolean;
    avatar?: string;
  };
  isDark: boolean;
  meId: string;
  isHost: boolean;
  onToggleReady?: (playerId: string) => void;
  onPromote?: (playerId: string) => void;
  onKick?: (playerId: string) => void;
}) {
  return (
    <Animated.View
      entering={FadeInUp.springify().mass(0.6)}
      exiting={FadeOut}
      layout={LinearTransition.springify()}
    >
      <View
        style={[
          styles.playerRow,
          {
            backgroundColor: isDark ? "#1b1b1d" : "#FFFFFF",
            borderColor: isDark ? "#2C2C2C" : "#E4E4E7",
          },
        ]}
      >
        <Text style={styles.avatar}>{item.avatar ?? "🙂"}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.playerName, { color: isDark ? "#fff" : "#111" }]}
          >
            {item.name} {item.isHost ? "(Host)" : ""}{" "}
            {item.id === meId ? "• You" : ""}
          </Text>
          <Text style={[styles.subtle, { color: isDark ? "#B3B3B3" : "#666" }]}>
            {item.isReady || item.isHost
              ? item.isHost
                ? "Controls game"
                : "Ready"
              : "Not ready"}
          </Text>
        </View>

        {/* Self: ready toggle */}
        {item.id === meId && !isHost ? (
          <Button
            title={item.isReady ? "Unready" : "I'm Ready"}
            size="sm"
            variant={item.isReady ? "secondary" : "primary"}
            fullWidth={false}
            onPress={() => onToggleReady?.(item.id)}
          />
        ) : null}

        {/* Host tools per-player */}
        {isHost && !item.isHost ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <IconButton variant="ghost" onPress={() => onPromote?.(item.id)}>
              ⭐
            </IconButton>
            <IconButton variant="ghost" onPress={() => onKick?.(item.id)}>
              ✕
            </IconButton>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  playerRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: { fontSize: 22 },
  playerName: { fontSize: 16, fontWeight: "700" },
  subtle: { fontSize: 12 },
});
