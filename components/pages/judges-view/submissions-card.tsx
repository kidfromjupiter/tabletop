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

  // NEW: selectedAnim drives glow/scale/shadow when selected
  const selectedAnim = useSharedValue(0);

  useEffect(() => {
    flip.value = withTiming(revealed ? 1 : 0, { duration: 240 });
  }, [revealed, flip]);

  useEffect(() => {
    selectedAnim.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected, selectedAnim]);

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

  // Outer wrapper animated style -> glow, scale, shadow intensity
  const wrapperStyle = useAnimatedStyle(() => {
    // interpolate so 0 = normal, 1 = selected
    const scale = interpolate(selectedAnim.value, [0, 1], [1, 1.04]);
    const borderWidth = interpolate(selectedAnim.value, [0, 1], [1, 3]);
    const borderColorOpacity = interpolate(selectedAnim.value, [0, 1], [0, 1]);

    return {
      transform: [{ scale }],
      borderWidth,
      borderColor: `rgba(138,92,246,${borderColorOpacity})`, // purple border
      // Android shadow
      boxShadow: `0 ${interpolate(selectedAnim.value, [0, 1], [2, 12])} ${interpolate(
        selectedAnim.value,
        [0, 1],
        [6, 24]
      )} rgba(106, 90, 224,${interpolate(selectedAnim.value, [0, 1], [0.1, 0.8])})`,
      // elevation: interpolate(selectedAnim.value, [0, 1], [2, 10]),
    };
  });

  // Glow halo under card (absolute)
  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: selectedAnim.value,
      // blur-ish fake glow using big shadow on a View
      boxShadow: `0 ${interpolate(selectedAnim.value, [0, 1], [2, 12])} ${interpolate(
        selectedAnim.value,
        [0, 1],
        [6, 30]
      )}
       rgba(106, 90, 224,${interpolate(selectedAnim.value, [0, 1], [0.1, 1])})`,
      // elevation: 20,
    };
  });

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
      style={[styles.cardOuter]}
    >
      {/* glow layer */}
      <Animated.View style={[styles.glowLayer, glowStyle]} />

      {/* actual card */}
      <Animated.View style={[styles.cardWrap, wrapperStyle]}>
        <Pressable onPress={handlePress} style={{ flex: 1 }}>
          {/* FRONT (revealed content) */}
          <Animated.View
            style={[
              styles.whiteCard,
              {
                backgroundColor: isDark ? "#F8FAFC" : "#FFFFFF",
              },
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
              {
                backgroundColor: isDark ? "#27272A" : "#E5E7EB",
              },
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    flex: 1,
    marginLeft: 12,
    marginRight: 0,
    height: 160,
    justifyContent: "center",
  },

  // invisible view under the card used to paint the glow
  glowLayer: {
    position: "absolute",
    left: 6,
    right: 6,
    top: 0,
    bottom: 0,
    borderRadius: 10,
    backgroundColor: "transparent",
    overflow: "visible",
  },

  cardWrap: {
    flex: 1,
    borderRadius: 16,
    borderColor: "#E5E7EB",
    backgroundColor: "transparent",
    overflow: "hidden",
  },

  whiteCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
  },

  whiteText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
    color: "#111",
    textAlign: "center",
  },

  maskRows: { gap: 8, alignItems: "center" },
  mask: {
    height: 14,
    backgroundColor: "#9CA3AF",
    borderRadius: 999,
    opacity: 0.4,
  },
});
