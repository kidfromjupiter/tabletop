import * as React from "react";
import {
  BackHandler,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type Variant = "center" | "bottom";

type PaperModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;

  /** "center" (default) or "bottom" for a sheet-like modal */
  variant?: Variant;

  /** Enable drag-to-close (default true for bottom, false for center) */
  enablePanToClose?: boolean;

  /** Optional container style for the modal card */
  contentStyle?: ViewStyle;

  /** Backdrop opacity (0..1) */
  backdropOpacity?: number;

  /** Whether tapping the backdrop closes the modal (default true) */
  closeOnBackdropPress?: boolean;

  /** Spring stiffness/damping (tuned defaults) */
  spring?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
};

export function PaperModal({
  visible,
  onClose,
  children,
  variant = "center",
  enablePanToClose,
  contentStyle,
  backdropOpacity = 0.45,
  closeOnBackdropPress = true,
  spring,
}: PaperModalProps) {
  // derive defaults
  const panEnabled = enablePanToClose ?? (variant === "bottom" ? true : false);

  // mount state to allow exit animations
  const [mounted, setMounted] = React.useState(visible);

  // animation values
  const progress = useSharedValue(0); // 0 = hidden, 1 = shown
  const translateY = useSharedValue(0); // used for bottom sheet drag
  const sheetStartY = useSharedValue(0);

  // show/hide animations
  React.useEffect(() => {
    console.log("PaperModal render, visible=", visible);
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 180 });
      if (variant === "bottom") {
        translateY.value = withSpring(0, {
          stiffness: spring?.stiffness ?? 320,
          damping: spring?.damping ?? 28,
          mass: spring?.mass ?? 1,
        });
      }
    } else {
      // exit
      progress.value = withTiming(0, { duration: 160 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
      if (variant === "bottom") {
        translateY.value = withTiming(40); // tiny nudge down for nicer fade
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, variant]);

  // handle Android back button (when visible)
  React.useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  // Backdrop style
  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        progress.value,
        [0, 1],
        [0, backdropOpacity],
        Extrapolate.CLAMP
      ),
    };
  });

  // Card (content) style
  const contentAnim = useAnimatedStyle(() => {
    if (variant === "center") {
      // subtle scale + rise
      const scale = interpolate(progress.value, [0, 1], [0.94, 1]);
      const ty = interpolate(progress.value, [0, 1], [12, 0]);
      return {
        transform: [{ scale }, { translateY: ty }],
      };
    } else {
      // bottom sheet: slide up from +40 to 0, plus interactive translateY
      const baseY = interpolate(progress.value, [0, 1], [40, 0]);
      return {
        transform: [{ translateY: baseY + translateY.value }],
      };
    }
  });

  // Pan gesture for bottom sheet
  const pan = Gesture.Pan()
    .enabled(panEnabled && variant === "bottom")
    .onBegin(() => {
      sheetStartY.value = translateY.value;
    })
    .onUpdate((e) => {
      const nextY = sheetStartY.value + e.translationY;
      // only allow dragging downward (positive y)
      translateY.value = Math.max(0, nextY);
    })
    .onEnd((e) => {
      const shouldClose = e.velocityY > 900 || translateY.value > 120; // threshold
      if (shouldClose) {
        translateY.value = withTiming(300, { duration: 180 }, (f) => {
          if (f) runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, {
          stiffness: spring?.stiffness ?? 320,
          damping: spring?.damping ?? 28,
          mass: spring?.mass ?? 1,
        });
      }
    });

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      onRequestClose={onClose}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.fill}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          {/* backdrop press */}
          {closeOnBackdropPress && (
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          )}
        </Animated.View>

        {/* Content */}
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.container,
              variant === "center" ? styles.center : styles.bottom,
            ]}
            pointerEvents="box-none"
          >
            <Animated.View
              style={[
                styles.card,
                variant === "bottom" ? styles.cardBottom : styles.cardCenter,
                contentStyle,
                contentAnim,
              ]}
              // Make area outside card pass touches to backdrop
              pointerEvents="box-none"
            >
              {/* Grab handle for bottom sheet (optional) */}
              {variant === "bottom" && (
                <View style={styles.handleWrap}>
                  <View style={styles.handle} />
                </View>
              )}

              {/* Actual user content */}
              <View style={styles.cardInner}>{children}</View>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  bottom: {
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    //paddingBottom: Platform.select({ ios: 32, android: 24 }),
  },
  card: {
    //maxWidth: 640,
    width: "100%",
    borderRadius: 20,
    // "Paper" look
    backgroundColor: "#141414ff",
    // shadow (iOS)
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    // elevation (Android)
    elevation: 12,
    overflow: "hidden",
  },
  cardCenter: {
    padding: 20,
  },
  cardBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardInner: {
    // Content wrapper so padding can be overridden via contentStyle if needed

    paddingBottom: Platform.select({ ios: 32, android: 24 }),
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(160, 160, 160, 0.15)",
  },
});
