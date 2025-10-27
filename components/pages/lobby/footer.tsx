import { Button } from "@/components/ui/button";
import { Player } from "@/lib/state";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function Footer({
  isHost,
  allReady,
  players,
  meId,
  onStart,
  onToggleReady,
}: {
  isHost: boolean;
  allReady: boolean;
  players: Player[];
  meId: string;
  onStart: () => void;
  onToggleReady: () => void;
}) {
  const me = players.find((p) => p.id === meId);
  const isReady = me?.isReady;

  return (
    <View style={styles.footerBar}>
      {isHost ? (
        <Button title="Start Game" onPress={onStart} disabled={!allReady} />
      ) : (
        <Button
          title={isReady ? "Unready" : "I'm Ready"}
          variant={isReady ? "secondary" : "primary"}
          onPress={onToggleReady}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footerBar: { paddingHorizontal: 16, paddingBottom: 16 },
});
