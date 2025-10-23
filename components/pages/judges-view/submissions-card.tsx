import React, { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function SubmissionCard({
  item,
  isSelected,
  onReveal,
  onSelect,
  pickCount,
}: {
  item: {
    id: string;
    texts: string[];
    revealed?: boolean;
  };
  isSelected: boolean;
  onReveal: () => void;
  onSelect: () => void;
  pickCount: number;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [revealed, setRevealed] = React.useState(item.revealed || false);
  const flip = useSharedValue(revealed ? 1 : 0); // 0 = hidden back, 1 = revealed front

  useEffect(() => {
    flip.value = withTiming(revealed ? 1 : 0, { duration: 240 });
  }, [revealed, flip]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flip.value, [0, 1], [180, 0])}deg` }],
    backfaceVisibility: "hidden" as const,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(flip.value, [0, 1], [0, -180])}deg` },
    ],
    backfaceVisibility: "hidden" as const,
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  function handlePress() {
    if (!revealed) {
      onReveal();
      setRevealed(true);
    } else {
      onSelect();
    }
  }

  return (
    <Animated.View
      entering={FadeIn.springify()}
      layout={LinearTransition.springify()}
      style={[
        styles.cardWrap,
        isSelected && {
          borderColor: isDark ? "#8B7BFF" : "#6A5AE0",
          borderWidth: 2,
        },
      ]}
    >
      <Pressable onPress={handlePress} style={{ flex: 1 }}>
        {/* FRONT (revealed content) */}
        <Animated.View
          style={[
            styles.whiteCard,
            { backgroundColor: isDark ? "#F8FAFC" : "#FFFFFF" },
            frontStyle,
          ]}
        >
          {item.texts.map((t, idx) => (
            <Text key={idx} style={[styles.whiteText]}>
              {pickCount > 1 ? `${idx + 1}. ` : ""}
              {t}
            </Text>
          ))}
        </Animated.View>
        {/* BACK (hidden pattern) */}
        <Animated.View
          style={[
            styles.whiteCard,
            { backgroundColor: isDark ? "#27272A" : "#E5E7EB" },
            backStyle,
          ]}
        >
          <View style={styles.maskRows}>
            <View style={[styles.mask, { width: "70%" }]} />
            <View style={[styles.mask, { width: "55%" }]} />
            <View style={[styles.mask, { width: "80%" }]} />
          </View>
          <Text
            style={{
              fontSize: 12,
              opacity: 0.6,
              marginTop: 8,
              textAlign: "center",
              color: isDark ? "#EDEDED" : "#333",
            }}
          >
            Tap to reveal
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    flex: 1,
    marginHorizontal: 0,
    marginLeft: 12,
    marginRight: 0,
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  whiteCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    justifyContent: "center",
  },
  whiteText: { fontSize: 16, fontWeight: "700", lineHeight: 20, color: "#111" },
  maskRows: { gap: 8 },
  mask: {
    height: 14,
    backgroundColor: "#9CA3AF",
    borderRadius: 999,
    opacity: 0.4,
  },
});
