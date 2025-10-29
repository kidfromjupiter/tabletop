// src/audio/SoundEffectsProvider.tsx
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type SfxName = "tap" | "success" | "error";

type SoundEffectsContextValue = {
  play: (name: SfxName) => void;
  enabled: boolean;
  toggleEnabled: () => void;
};

const SoundEffectsContext = createContext<SoundEffectsContextValue | null>(
  null
);

export function SoundEffectsProvider({ children }: { children: ReactNode }) {
  // simple in-memory mute toggle
  const [enabled, setEnabled] = useState(true);

  // preload your SFX clips
  const tapPlayer = useAudioPlayer(require("../../assets/sfx/tap.mp3"));
  const successPlayer = useAudioPlayer(require("../../assets/sfx/success.mp3"));
  const errorPlayer = useAudioPlayer(require("../../assets/sfx/error.mp3"));

  // Configure global audio mode once (iOS silent switch, mixing, etc.)
  useEffect(() => {
    setAudioModeAsync({
      // Play even if the iPhone is on silent
      playsInSilentMode: true,
      // Don't kill other apps' audio, just duck it on Android
      interruptionModeAndroid: "duckOthers",
      // Mix with other audio on iOS instead of pausing it
      interruptionMode: "mixWithOthers",
      // We don't need SFX in background for this use case
      shouldPlayInBackground: false,
    }).catch((err) => {
      console.warn("Failed to set audio mode:", err);
    });
  }, []);

  // helper to actually trigger a sound
  const triggerPlayer = useCallback((player: any) => {
    // expo-audio keeps the playhead at the end after finishing.
    // So always rewind to 0 before replay.
    player.seekTo(0);
    player.play();
  }, []);

  const play = useCallback(
    (name: SfxName) => {
      if (!enabled) return;

      switch (name) {
        case "tap":
          triggerPlayer(tapPlayer);
          break;
        case "success":
          triggerPlayer(successPlayer);
          break;
        case "error":
          triggerPlayer(errorPlayer);
          break;
        default:
          break;
      }
    },
    [enabled, tapPlayer, successPlayer, errorPlayer, triggerPlayer]
  );

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      play,
      enabled,
      toggleEnabled,
    }),
    [play, enabled, toggleEnabled]
  );

  return (
    <SoundEffectsContext.Provider value={value}>
      {children}
    </SoundEffectsContext.Provider>
  );
}

// Hook for consuming the context in any component
export function useSoundEffects() {
  const ctx = useContext(SoundEffectsContext);
  if (!ctx) {
    throw new Error(
      "useSoundEffects() must be used inside <SoundEffectsProvider>"
    );
  }
  return ctx;
}
