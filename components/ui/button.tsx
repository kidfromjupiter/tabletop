import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * ui.buttons.tsx
 * Reusable animated buttons for React Native + Reanimated.
 * Includes: Button, IconButton, StepButton.
 * - Variants: primary | secondary | ghost
 * - Sizes: sm | md | lg
 * - Optional left/right accessory (icon or element)
 * - Animated press-in/out scale spring
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  testID?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function Button({
  title,
  onPress,
  onLongPress,
  disabled,
  loading,
  variant = "primary",
  size = "md",
  fullWidth = true,
  testID,
  left,
  right,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const { bg, fg, border } = themedColors(isDark, variant, disabled);
  const padd = size === "lg" ? 16 : size === "md" ? 14 : 10;
  const fsize = size === "lg" ? 17 : size === "md" ? 16 : 14;

  return (
    <Animated.View style={[fullWidth && { width: "100%" }, animated]}>
      <Pressable
        accessibilityRole="button"
        testID={testID}
        disabled={disabled || loading}
        onPressIn={() =>
          (scale.value = withTiming(0.95, {
            duration: 80,
            easing: Easing.out(Easing.quad),
          }))
        }
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[
          styles.btn,
          { paddingVertical: padd, backgroundColor: bg, borderColor: border },
          variant === "ghost" && { borderWidth: StyleSheet.hairlineWidth },
        ]}
      >
        <View style={styles.rowCenter}>
          {left ? <View style={{ marginRight: 8 }}>{left}</View> : null}
          {loading ? (
            <ActivityIndicator
              size="small"
              color={
                variant === "ghost"
                  ? isDark
                    ? "#EAEAEA"
                    : "#222"
                  : isDark
                    ? "#0B0B0B"
                    : "#FFF"
              }
            />
          ) : (
            <Text style={[styles.btnText, { fontSize: fsize, color: fg }]}>
              {title}
            </Text>
          )}
          {right ? <View style={{ marginLeft: 8 }}>{right}</View> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export type IconButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
  size?: number; // diameter
  variant?: ButtonVariant; // controls bg/fg for circle
  children?: React.ReactNode; // put your icon here
  testID?: string;
};

export function IconButton({
  onPress,
  disabled,
  size = 44,
  variant = "secondary",
  children,
  testID,
}: IconButtonProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { bg, fg, border } = themedColors(isDark, variant, disabled);

  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animated]}>
      <Pressable
        accessibilityRole="button"
        testID={testID}
        disabled={disabled}
        onPressIn={() =>
          (scale.value = withSpring(0.96, { stiffness: 520, damping: 24 }))
        }
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={onPress}
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === "ghost" ? StyleSheet.hairlineWidth : 0,
        }}
      >
        <Text
          style={{
            color: fg,
            fontSize: Math.max(16, size * 0.36),
            fontWeight: "700",
          }}
        >
          {children ?? "•"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export type StepButtonProps = {
  label?: string; // e.g., "−" or "+"
  onPress?: () => void;
  disabled?: boolean;
};

export function StepButton({
  label = "+",
  onPress,
  disabled,
}: StepButtonProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animated]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPressIn={() =>
          (scale.value = withSpring(0.97, { stiffness: 520, damping: 24 }))
        }
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={onPress}
        style={{
          width: 48,
          height: 44,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#2A2A2A" : "#EFEFEF",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: isDark ? "#EDEDED" : "#222",
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------- Theme helpers ----------------
function themedColors(
  isDark: boolean,
  variant: ButtonVariant,
  disabled?: boolean
) {
  const accent600 = "#6A5AE0";
  const accent500 = "#8B7BFF";
  if (variant === "primary") {
    return {
      bg: disabled
        ? isDark
          ? "#463f7a"
          : "#a39af1"
        : isDark
          ? accent500
          : accent600,
      fg: isDark ? "#0B0B0B" : "#FFFFFF",
      border: "transparent",
    };
  }
  if (variant === "secondary") {
    return {
      bg: isDark ? "#3A3A3A" : "#EFEFEF",
      fg: isDark ? "#EDEDED" : "#222",
      border: "transparent",
    };
  }
  // ghost
  return {
    bg: "transparent",
    fg: isDark ? "#EAEAEA" : "#222",
    border: isDark ? "#3A3A3A" : "#D9D9D9",
  };
}

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontWeight: "700", letterSpacing: 0.2 },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Usage examples
 *
 * // WelcomeScreen
 * <Button title="Create Game" variant="primary" onPress={onCreateGame} />
 * <Button title="Join Game" variant="secondary" onPress={onJoinGame} />
 * <Button title="Pass & Play" variant="ghost" onPress={onPassAndPlay} />
 *
 * // CreateGameScreen
 * <Button title="New" variant="secondary" size="sm" fullWidth={false} onPress={regenerateCode} />
 * <Button title="Start Game" variant="primary" size="lg" onPress={handleStart} />
 * <StepButton label="−" onPress={dec} />
 * <StepButton label="+" onPress={inc} />
 *
 * // Icon-only (e.g., back chevron)
 * <IconButton variant="ghost" onPress={onBack}>{"‹"}</IconButton>
 */
