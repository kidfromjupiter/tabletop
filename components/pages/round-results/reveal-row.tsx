import type { RevealItem } from "@/app/round-results"; // Import RevealItem type
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const AnimatedLG = Animated.createAnimatedComponent(LinearGradient);

export function RevealRow({
  item,
  visible,
  isWinner,
  isDark,
}: {
  item: RevealItem;
  visible: boolean;
  isWinner: boolean;
  isDark: boolean;
}) {
  const progress = useSharedValue(visible ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible]);

  const t = useSharedValue(0);
  React.useEffect(() => {
    if (!isWinner) {
      t.value = 0;
      return;
    }
    t.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true
    );
  }, [isWinner]);

  const topOpacity = useAnimatedStyle(() => ({ opacity: t.value }));
  const bottomOpacity = useAnimatedStyle(() => ({ opacity: 1 - t.value }));

  const hiddenStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -8]) },
      { scale: interpolate(progress.value, [0, 1], [1, 0.98]) },
    ],
    pointerEvents: progress.value < 0.5 ? "auto" : ("none" as any),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [12, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.98, 1]) },
    ],
    pointerEvents: progress.value > 0.5 ? "auto" : ("none" as any),
  }));
  const glowStyle = useAnimatedStyle(() => {
    const shadowOpacity = t.value * 0.75;
    return {
      boxShadow: `0 0 30px 6px rgba(106, 90, 224, ${shadowOpacity})`,
    };
  });

  const colorsA: [string, string, string] = isDark
    ? ["#6A5AE0", "#10B981", "#8B7BFF"]
    : ["#6A5AE0", "#06B6D4", "#8B7BFF"];
  const colorsB: [string, string, string] = isDark
    ? ["#8B7BFF", "#EC4899", "#6A5AE0"]
    : ["#8B7BFF", "#F43F5E", "#6A5AE0"];

  return (
    <Animated.View
      layout={LinearTransition.springify()}
      style={{ marginHorizontal: 12 }}
    >
      <View style={{ minHeight: 64 }}>
        <Animated.View
          style={[StyleSheet.absoluteFill, hiddenStyle, styles.hiddenRow]}
        >
          <Text style={{ opacity: 0.6, color: isDark ? "#EDEDED" : "#333" }}>
            Hidden submission…
          </Text>
        </Animated.View>

        <Animated.View style={[cardStyle]}>
          {isWinner ? (
            <View pointerEvents="none" style={styles.glowShadow} />
          ) : null}

          <Animated.View
            style={[styles.gradientBorder, isWinner ? glowStyle : null]}
          >
            {isWinner ? (
              <>
                <AnimatedLG
                  colors={colorsA}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    StyleSheet.absoluteFill,
                    styles.gradientFill,
                    bottomOpacity,
                  ]}
                />
                <AnimatedLG
                  colors={colorsB}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[
                    StyleSheet.absoluteFill,
                    styles.gradientFill,
                    topOpacity,
                  ]}
                />
              </>
            ) : null}

            <Animated.View style={[styles.revealRowInner]}>
              {item.texts.map((txt: string, idx: number) => (
                <Text key={idx} style={[styles.revealText, { color: "#111" }]}>
                  {item.texts.length > 1 ? `${idx + 1}. ` : ""}
                  {txt}
                </Text>
              ))}
              {isWinner ? <Text style={styles.winnerBadge}>Winner</Text> : null}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hiddenRow: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 0,
    marginHorizontal: 4,
  },
  revealText: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  winnerBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#10B981",
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  gradientBorder: {
    overflow: "hidden",
    padding: 4,
    borderRadius: 14,
    marginHorizontal: 12,
    position: "relative",
  },
  revealRowInner: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  gradientFill: {
    opacity: 1,
  },
  glowShadow: {
    position: "absolute",
    left: 6,
    right: 6,
    top: -2,
    bottom: -2,
    borderRadius: 18,
  },
});
