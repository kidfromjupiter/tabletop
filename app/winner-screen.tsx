import LottieView from "@/components/compat-shims/lottie";
import { Button } from "@/components/ui/button";
import Header from "@/components/ui/header";
import { useGameStore } from "@/lib/state";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export type WinnerScreenProps = {
  onPlayAgain?: () => void;
  onExit?: () => void;
  /** local asset or remote url; set to undefined to skip */
  victorySound?: any; // e.g. require("../assets/sfx/victory.mp3")
  /** Lottie file (JSON or .lottie) for confetti */
  confettiSource?: any; // e.g. require("../assets/lottie/confetti.json")
};

// Confetti (LottieFiles) ---------------------------------------------------
function LottieConfetti({ source }: { source?: any }) {
  if (!source) return null;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}
    >
      {Platform.OS == "web" ? (
        // web doesn't like resizeMode property
        <LottieView
          source={source}
          autoPlay
          loop={false}
          //style={[StyleSheet.absoluteFill]}
        />
      ) : (
        <LottieView
          source={source}
          autoPlay
          loop={false}
          //style={[StyleSheet.absoluteFill]}
          resizeMode={"cover"}
        />
      )}
    </View>
  );
}

// Glow ring behind avatar -------------------------------------------
function PulsingGlow({ size = 128, color = "#FFD166" }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900 })
      ),
      -1,
      true
    );
  }, [s]);
  const glow = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
    opacity: 0.9,
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
          elevation: 16,
        },
        glow,
      ]}
    />
  );
}

// Medal flourish -----------------------------------------------------
function Medal({ delay = 0 }) {
  const enter = new Keyframe({
    0: { transform: [{ translateY: -40 }, { rotate: "-8deg" }], opacity: 0 },
    50: {
      transform: [{ translateY: 10 }, { rotate: "0deg" }],
      opacity: 1,
      easing: Easing.out(Easing.back(1.5)),
    },
    100: {
      transform: [{ translateY: 0 }, { rotate: "0deg" }],
      opacity: 1,
      easing: Easing.out(Easing.back(1.5)),
    },
  })
    .duration(600)
    .delay(delay);
  return (
    <Animated.View
      entering={enter}
      style={{
        position: "absolute",
        top: -8,
        right: -8,
        backgroundColor: "#FFD700",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        shadowColor: "#FFD700",
        shadowOpacity: 0.8,
        shadowRadius: 10,
      }}
    >
      <Text style={{ fontWeight: "800" }}>🥇</Text>
    </Animated.View>
  );
}

// Winner Screen ------------------------------------------------------
export default function WinnerScreen() {
  const ring = useSharedValue(0);
  const leaveRoom = useGameStore((state) => state.leaveRoom);

  const players = useGameStore((state) =>
    state.players.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreB - scoreA;
    })
  );
  const winner = players[0];

  console.log("Rendering WinnerScreen for winner:", winner);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  useEffect(() => {
    // kickoff subtle ring pulse and sound once mounted
    ring.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 800 })
      ),
      -1,
      true
    );
    //playVictory(victorySound);
  }, []);
  const ringStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.6 + ring.value * 0.4,
    transform: [{ scale: 1 + ring.value * 0.02 }],
  }));
  const router = useRouter();

  if (!winner) return null;
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      <LottieConfetti
        source={require("../assets/lottie/mobile_confetti.json")}
      />

      <Header title="Winner Winner!" isDark={isDark} />
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={[
          styles.winnerCard,
          { backgroundColor: isDark ? "#151515" : "#FFFFFF", zIndex: 0 },
          ringStyle,
        ]}
      >
        <View
          style={{
            width: 140,
            height: 140,
            alignSelf: "center",
            marginBottom: 10,
          }}
        >
          <PulsingGlow size={140} />
          {winner.avatar ? (
            <Image source={{ uri: winner.avatar }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                { alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Text style={{ fontSize: 56 }}>👑</Text>
            </View>
          )}
          <Medal delay={250} />
        </View>
        <Text style={[styles.winnerName, { color: isDark ? "#fff" : "#111" }]}>
          {winner.name}
        </Text>
        <Text
          style={[styles.plusOne, { color: isDark ? "#22C55E" : "#16A34A" }]}
        >
          Score {winner.score}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(250)}
        style={[
          styles.sectionCard,
          { backgroundColor: isDark ? "#151515" : "#FFFFFF" },
        ]}
      >
        <FlatList
          data={players}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item: p, index: i }) => (
            <View
              style={[
                styles.scoreRow,
                { borderColor: isDark ? "#2c2c2c" : "#E5E7EB" },
              ]}
              key={p.id}
            >
              <Text style={styles.rowAvatar}>{p.avatar ?? "🙂"}</Text>
              <Text
                style={[styles.scoreName, { color: isDark ? "#fff" : "#111" }]}
              >
                {p.name}
              </Text>
              <View style={{ flex: 1 }} />
              <Text
                style={[styles.scoreVal, { color: isDark ? "#fff" : "#111" }]}
              >
                {p.score}
              </Text>
            </View>
          )}
        />
      </Animated.View>

      <View style={styles.footer}>
        <Button
          title="Exit"
          onPress={() => {
            leaveRoom();
            router.dismissTo("/welcome");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

// Styles -------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "red" },
  container: {
    flex: 1,
    backgroundColor: "#0B1221",
    paddingTop: 48,
    alignItems: "center",
  },
  winnerCard: {
    backgroundColor: "#101A33",
    borderRadius: 20,
    padding: 16,
    alignSelf: "stretch",
    alignItems: "center",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
    margin: 22,
  },
  rowAvatar: { fontSize: 22 },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "#FBBF24",
  },
  name: {
    marginTop: 4,
    color: "#F3F4F6",
    fontSize: 22,
    fontWeight: "800",
  },
  score: {
    color: "#93C5FD",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  leaderboard: {
    alignSelf: "stretch",
    marginTop: 20,
    gap: 8,
  },
  row: {
    backgroundColor: "#0E1730",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowHighlight: {
    backgroundColor: "#122044",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  pos: { color: "#9CA3AF", width: 26, fontWeight: "700" },
  posHighlight: { color: "#F59E0B" },
  rowName: { color: "#D1D5DB", flex: 1, fontWeight: "700" },
  rowNameHighlight: { color: "#FFFFFF" },
  rowScore: {
    color: "#9CA3AF",
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
  rowScoreHighlight: { color: "#93C5FD" },
  actions: { flexDirection: "row", gap: 12, marginTop: 24 },
  btn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  btnPrimary: { backgroundColor: "#2563EB" },
  btnGhost: { backgroundColor: "#E5E7EB" },
  btnText: { color: "white", fontWeight: "800", letterSpacing: 0.5 },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  title: { fontSize: 20, fontWeight: "800" },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  scoreName: { fontSize: 16, fontWeight: "700" },
  scoreVal: {
    fontSize: 16,
    fontWeight: "900",
    minWidth: 28,
    textAlign: "right",
  },
  // round-results shared styles
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
  },
  winnerName: { fontSize: 18, fontWeight: "900" },
  plusOne: { fontSize: 20, fontWeight: "900", color: "#22C55E" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16 },
});

// Usage example ------------------------------------------------------
// <WinnerScreen
//   winner={{ id: "p1", name: "Ellie", score: 10, avatarUrl: undefined }}
//   players={[
//     { id: "p1", name: "Ellie", score: 10 },
//     { id: "p2", name: "Tini", score: 7 },
//     { id: "p3", name: "Mina", score: 5 },
//   ]}
//   onPlayAgain={() => {/* reset room / navigate */}}
//   onExit={() => {/* leave room */}}
//   victorySound={require("../assets/sfx/victory.mp3")}
//   confettiSource={require("../assets/lottie/confetti.json")} // from LottieFiles
// />
