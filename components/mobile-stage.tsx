import { StageProvider } from "@/providers/stage-provider";
import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import FullscreenButton from "./fullscreen-button";

type Props = {
  baseWidth?: number; // logical design width (dp)
  baseHeight?: number; // logical design height (dp)
  children: React.ReactNode;
};

/** Letterboxes and scales children to a fixed design size (like a mobile screen). */
export default function MobileStage({
  baseWidth = 390,
  baseHeight = 844,
  children,
}: Props) {
  const { width: vw, height: vh } = useWindowDimensions();

  // scale to fit while preserving aspect
  const scale = Math.min(vw / baseWidth, vh / baseHeight);
  const stageW = baseWidth * scale;
  const stageH = baseHeight * scale;

  return (
    <View style={styles.screen}>
      {/* letterbox background */}
      <View style={[styles.letterbox]}>
        {/* centered, scaled "phone" */}
        <StageProvider
          value={{
            baseWidth,
            baseHeight,
            scale,
            stageW,
            stageH,
            vw,
            vh,
            sp: (v) => v * scale,
          }}
        >
          <View
            style={[
              styles.phone,
              {
                width: baseWidth,
                height: baseHeight,
                transform: [{ scale }],
              },
            ]}
          >
            {children}
          </View>
        </StageProvider>
      </View>
      <FullscreenButton
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0b0b", // outer background / bars
  },
  letterbox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  phone: {
    backgroundColor: "#111", // phone bezel/background
    borderRadius: 24,
    overflow: "hidden",
  },
});
