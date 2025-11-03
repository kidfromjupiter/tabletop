// src/audio/SoundEffectsProvider.tsx
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

// --- Types shared across native/web ---
type SfxName = "card-flip" | "card-draw";

type SafeAudioPlayer = {
  play: () => void;
  seekTo: (ms: number) => void;
};

type SoundEffectsContextValue = {
  play: (name: SfxName) => void;
  enabled: boolean;
  toggleEnabled: () => void;
};

const SoundEffectsContext = createContext<SoundEffectsContextValue | null>(
  null
);

// --- Native (iOS/Android) imports & helpers ---
let useNativeAudioPlayer: ((asset: any) => SafeAudioPlayer) | null = null;
let setAudioModeAsyncSafe: ((cfg: any) => Promise<void>) | null = null;

if (Platform.OS !== "web") {
  // Only require expo-audio on native to avoid web bundling issues
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expoAudio = require("expo-audio") as typeof import("expo-audio");
  const { useAudioPlayer, setAudioModeAsync } = expoAudio;

  useNativeAudioPlayer = (asset: any) => {
    const p = useAudioPlayer(asset);
    return {
      play: () => p.play(),
      seekTo: (ms: number) => p.seekTo(ms),
    };
  };
  setAudioModeAsyncSafe = setAudioModeAsync;
}

// --- Web shim for useAudioPlayer ---
function useWebAudioPlayer(asset: any): SafeAudioPlayer {
  // In Expo web, require(".../file.wav") resolves to a URL string.
  const url = useMemo(() => {
    // Handle common cases defensively
    if (typeof asset === "string") return asset;
    // Some bundlers put url at asset.default
    if (asset?.default && typeof asset.default === "string")
      return asset.default;
    return String(asset);
  }, [asset]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const a = new Audio(url);
      a.preload = "auto";
      audioRef.current = a;
    } catch {
      audioRef.current = null;
    }
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        // Clear src to help GC in some browsers
        a.src = "";
        audioRef.current = null;
      }
    };
  }, [url]);

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    // Replay reliably
    a.currentTime = 0;
    // Ignore play promise failures (autoplay policies)
    a.play().catch(() => {});
  }, []);

  const seekTo = useCallback((ms: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = (ms || 0) / 1000;
  }, []);

  return useMemo(() => ({ play, seekTo }), [play, seekTo]);
}

// Unified hook that picks native or web implementation
function useSafeAudioPlayer(asset: any): SafeAudioPlayer {
  if (Platform.OS === "web") return useWebAudioPlayer(asset);
  return useNativeAudioPlayer!(asset);
}

export function SoundEffectsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  // Preload SFX clips (same paths as your original)
  const cardSound = useSafeAudioPlayer(
    require("../assets/audio/paper-landing.wav")
  );
  const card1 = useSafeAudioPlayer(require("../assets/audio/card-2.wav"));

  // Configure global audio mode on native only
  useEffect(() => {
    if (Platform.OS === "web" || !setAudioModeAsyncSafe) return;
    setAudioModeAsyncSafe({
      playsInSilentMode: true,
      interruptionModeAndroid: "duckOthers",
      interruptionMode: "mixWithOthers",
      shouldPlayInBackground: false,
    }).catch((err: unknown) => {
      console.warn("Failed to set audio mode:", err);
    });
  }, []);

  const triggerPlayer = useCallback((player: SafeAudioPlayer) => {
    player.seekTo(0);
    player.play();
  }, []);

  const play = useCallback(
    (name: SfxName) => {
      if (!enabled) return;
      switch (name) {
        case "card-flip":
          triggerPlayer(cardSound);
          break;
        case "card-draw":
          triggerPlayer(card1);
          break;
        default:
          break;
      }
    },
    [enabled, cardSound, card1, triggerPlayer]
  );

  const toggleEnabled = useCallback(() => setEnabled((p) => !p), []);

  const value = useMemo(
    () => ({ play, enabled, toggleEnabled }),
    [play, enabled, toggleEnabled]
  );

  return (
    <SoundEffectsContext.Provider value={value}>
      {children}
    </SoundEffectsContext.Provider>
  );
}

export function useSoundEffects() {
  const ctx = useContext(SoundEffectsContext);
  if (!ctx)
    throw new Error(
      "useSoundEffects() must be used inside <SoundEffectsProvider>"
    );
  return ctx;
}
