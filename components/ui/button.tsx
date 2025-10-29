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

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  title: string;
  onPress?: () => void | Promise<void>;
  onLongPress?: () => void;
  disabled?: boolean;
  loading?: boolean; // manual override (still supported)
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  testID?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  autoLoading?: boolean; // NEW: auto spinner/disable while async onPress runs
  loadingText?: string; // optional text shown instead of spinner (if you prefer)
  indicatorSize?: "small" | "large";
};

export function Button({
  title,
  onPress,
  onLongPress,
  disabled,
  loading, // manual loading still works
  variant = "primary",
  size = "md",
  fullWidth = true,
  testID,
  left,
  right,
  autoLoading = true,
  loadingText,
  indicatorSize = "small",
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

  // Internal loading state for autoLoading mode
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = loading ?? internalLoading;
  const isDisabled = disabled || isLoading;

  const spinnerColor = fg;

  const handlePress = React.useCallback(async () => {
    if (!onPress) return;
    try {
      const result = onPress();
      if (autoLoading && result && typeof (result as any).then === "function") {
        setInternalLoading(true);
        await result;
      }
    } finally {
      if (autoLoading) setInternalLoading(false);
    }
  }, [onPress, autoLoading]);

  return (
    <Animated.View style={[fullWidth && { width: "100%" }, animated]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: isLoading }}
        testID={testID}
        disabled={isDisabled}
        onPressIn={() => {
          if (isDisabled) return;
          scale.value = withTiming(0.95, {
            duration: 80,
            easing: Easing.out(Easing.quad),
          });
        }}
        onPressOut={() => {
          if (isDisabled) return;
          scale.value = withSpring(1);
        }}
        onPress={handlePress}
        onLongPress={onLongPress}
        style={[
          styles.btn,
          {
            paddingVertical: padd,
            backgroundColor: bg,
            borderColor: border,
            opacity: isDisabled ? 0.6 : 1,
          },
          variant === "ghost" && { borderWidth: StyleSheet.hairlineWidth },
        ]}
      >
        <View style={styles.rowCenter}>
          {left ? <View style={{ marginRight: 8 }}>{left}</View> : null}

          {isLoading ? (
            loadingText ? (
              <Text style={[styles.btnText, { fontSize: fsize, color: fg }]}>
                {loadingText}
              </Text>
            ) : (
              <ActivityIndicator size={indicatorSize} color={spinnerColor} />
            )
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
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  size?: number; // diameter in px
  variant?: ButtonVariant;
  children?: React.ReactNode; // icon / glyph
  testID?: string;

  // new bits:
  loading?: boolean; // external/manual loading
  autoLoading?: boolean; // auto-handle async onPress just like Button
  indicatorSize?: "small" | "large";
};

export function IconButton({
  onPress,
  disabled,
  size = 44,
  variant = "secondary",
  children,
  testID,
  loading,
  autoLoading = true,
  indicatorSize = "small",
}: IconButtonProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { bg, fg, border } = themedColors(isDark, variant, disabled);

  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // internal loading state for auto mode
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = loading ?? internalLoading;
  const isDisabled = disabled || isLoading;

  const spinnerColor = fg;

  const handlePress = React.useCallback(async () => {
    if (!onPress) return;
    try {
      const maybePromise = onPress();
      if (
        autoLoading &&
        maybePromise &&
        typeof (maybePromise as any).then === "function"
      ) {
        setInternalLoading(true);
        await maybePromise;
      }
    } finally {
      if (autoLoading) {
        setInternalLoading(false);
      }
    }
  }, [onPress, autoLoading]);

  return (
    <Animated.View style={[animated, { opacity: isDisabled ? 0.6 : 1 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: isLoading }}
        testID={testID}
        disabled={isDisabled}
        onPressIn={() => {
          if (isDisabled) return;
          scale.value = withSpring(0.96, { stiffness: 520, damping: 24 });
        }}
        onPressOut={() => {
          if (isDisabled) return;
          scale.value = withSpring(1);
        }}
        onPress={handlePress}
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
        {isLoading ? (
          <ActivityIndicator size={indicatorSize} color={spinnerColor} />
        ) : (
          <Text
            style={{
              color: fg,
              fontSize: Math.max(16, size * 0.36),
              fontWeight: "700",
            }}
          >
            {children ?? "•"}
          </Text>
        )}
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
// 3) Update themedColors to include a "danger" branch
function themedColors(
  isDark: boolean,
  variant: ButtonVariant,
  disabled?: boolean
) {
  const accent600 = "#6a5ae0ff";
  const accent500 = "#8B7BFF";

  // Reds for danger
  const red600 = "#E5484D"; // prominent destructive
  const red700 = "#CD2B31"; // pressed/dark fallback
  const red300 = "#FFB1B6"; // disabled tint (light)
  const red400 = "#FF6B72"; // disabled tint (dark)

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

  if (variant === "danger") {
    return {
      bg: disabled ? (isDark ? red400 : red300) : isDark ? red400 : red600,
      fg: "#FFFFFF", // white text/spinner for strong contrast
      border: "transparent",
    };
  }

  // ghost (neutral outline)
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
