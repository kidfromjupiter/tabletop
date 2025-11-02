import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";

type ToastOptions = {
  duration?: number; // ms
};

type ToastContextValue = {
  show: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// ---- Public API you can import anywhere -------------------------------------
/** Call this from anywhere: showToast("Saved!") */
export function showToast(message: string, options?: ToastOptions) {
  if (Platform.OS === "android" && ToastAndroid) {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  // delegate to provider (iOS/Web); if not mounted, do a super-light fallback
  if (__toastImpl) {
    __toastImpl(message, options);
  } else {
    // Last-ditch fallback if provider isn’t mounted yet (renders as a temp DOM alert on web)
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      window.alert(message);
    } else {
      console.log("Toast:", message);
    }
  }
}

// Internal bridge the provider registers with:
let __toastImpl: ((message: string, options?: ToastOptions) => void) | null =
  null;

// ---- Provider & in-app renderer (used on iOS & Web) -------------------------
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const api = useMemo<ToastContextValue>(() => ({ show: showToast }), []);
  const setImplRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "android") {
      __toastImpl = (msg, opts) => _enqueue(msg, opts);
      setImplRef.current = true;
    }
    return () => {
      if (setImplRef.current) __toastImpl = null;
    };
  }, []);

  // simple queue so rapid toasts don’t overlap weirdly
  const [queue, setQueue] = useState<
    { id: number; text: string; duration: number }[]
  >([]);
  const [current, setCurrent] = useState<{
    id: number;
    text: string;
    duration: number;
  } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const _enqueue = (text: string, options?: ToastOptions) => {
    const duration = options?.duration ?? 2200;
    setQueue((q) => [...q, { id: Date.now() + Math.random(), text, duration }]);
  };

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setCurrent(next);
    }
  }, [queue, current]);

  useEffect(() => {
    if (!current) return;
    // fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // hold, then fade out
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(() => setCurrent(null));
      }, current.duration);
    });
  }, [current, opacity]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Render overlay only for iOS/Web */}
      {Platform.OS !== "android" && current ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.container,
            {
              opacity,
              transform: [
                {
                  translateY: opacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.toast}>
            <Text numberOfLines={3} style={styles.text}>
              {current.text}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

// Optional: hook if you prefer context usage
export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? { show: showToast };
}

const styles = StyleSheet.create({
  container: {
    position: "fixed" as any, // web-friendly; Native turns it into absolute
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    maxWidth: 640,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  text: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
  },
});
