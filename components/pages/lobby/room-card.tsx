import { Button } from "@/components/ui/button";
import { GameSettings } from "@/lib/state";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Tag } from "./tags";

export default function RoomCard({
  settings,
  isDark,
  pulseStyle,
  headerFg,
  onCopyInvite,
}: {
  settings: GameSettings;
  isDark: boolean;
  pulseStyle: any;
  headerFg: string;
  onCopyInvite?: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={[
        styles.roomCard,
        { backgroundColor: isDark ? "#151515" : "#fff" },
        pulseStyle,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={[
              styles.roomCodeLabel,
              { color: isDark ? "#CFCFCF" : "#6B7280" },
            ]}
          >
            Room Code
          </Text>
          <Text style={[styles.roomCode, { color: headerFg }]}>
            {settings.roomCode}
          </Text>
        </View>
        <Button
          title="Copy invite"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onPress={onCopyInvite}
        />
      </View>
      <View style={[styles.roomMetaRow]}>
        <Tag>{settings.isPrivate ? "Private" : "Public"}</Tag>
        <Text style={[styles.dot, { color: isDark ? "#5A5A5A" : "#AAA" }]}>
          •
        </Text>
        <Tag>{settings.familyMode ? "Family Mode" : "Anything Goes"}</Tag>
        <Text style={[styles.dot, { color: isDark ? "#5A5A5A" : "#AAA" }]}>
          •
        </Text>
        <Tag>{settings.packs.length} packs</Tag>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  roomCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  roomCodeLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  roomCode: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 2,
  },
  roomMetaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
  },
  dot: { fontSize: 14 },
});
