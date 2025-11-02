import React, { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type Props = { style?: ViewStyle };

export default function FullscreenButton({ style }: Props) {
  const isWeb = Platform.OS === "web";
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    if (!isWeb) return;
    const update = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", update);
    update();
    return () => document.removeEventListener("fullscreenchange", update);
  }, [isWeb]);

  const toggle = useCallback(async () => {
    if (!isWeb) return;
    try {
      if (!document.fullscreenElement) {
        // make the whole page fullscreen (simplest + most compatible)
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (e) {
      console.warn("Fullscreen toggle failed", e);
    }
  }, [isWeb]);

  return (
    <Pressable onPress={toggle} style={[styles.btn, style]}>
      <Text style={styles.txt}>{isFs ? "Exit Fullscreen" : "Fullscreen"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  txt: { color: "white", fontSize: 12, fontWeight: "600" },
});
