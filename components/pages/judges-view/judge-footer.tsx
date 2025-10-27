import { Button } from "@/components/ui/button";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export default function JudgeFooter({
  selectedId,
  confirmWinner,
}: {
  selectedId: string | null;
  confirmWinner: () => void;
}) {
  return (
    <View style={styles.footer}>
      {!selectedId && (
        <Animated.Text
          style={styles.footerText}
          entering={FadeIn}
          exiting={FadeOut}
        >
          Tap on a revealed card to select a winner
        </Animated.Text>
      )}

      <Button
        title="Confirm Winner"
        onPress={confirmWinner}
        disabled={!selectedId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "transparent",
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 10,
    color: "#888",
  },
});
