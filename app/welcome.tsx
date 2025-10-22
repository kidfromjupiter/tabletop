import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/state";
import { useFocusEffect, useRouter } from "expo-router";
import * as React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * WelcomeScreen.tsx (no reusables)
 * Single-file, self-contained welcome screen for a CAH-style game.
 * - No custom Button/Card components; only native primitives + styles.
 */

export default function WelcomeScreen({
  onCreateGame,
  onJoinGame,
  onPassAndPlay,
  onHowToPlay,
  appName = "Tabletop Party",
  tagline = "A terrible game for terribly funny people.",
  logoSource,
}: {
  onCreateGame?: () => void;
  onJoinGame?: () => void;
  onPassAndPlay?: () => void;
  onHowToPlay?: () => void;
  appName?: string;
  tagline?: string;
  logoSource?: any; // ImageSourcePropType
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const router = useRouter();
  const [mounted, setMounted] = React.useState(true);
  const toPhase = useGameStore((state) => state.toPhase);

  // tiny bob animation for logo
  const bob = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      bob.value = withSpring(1, { stiffness: 60, damping: 8 });
    }, [bob])
  );

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value * -4 }],
  }));

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F5F5F7" }]}
    >
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(250)} style={styles.headerRow}>
          <Text style={[styles.title, { color: isDark ? "#fff" : "#0B0B0B" }]}>
            {appName}
          </Text>
        </Animated.View>

        {/* Hero */}
        <Animated.View
          entering={FadeInDown.springify().damping(14).stiffness(180)}
          style={[
            styles.hero,
            { backgroundColor: isDark ? "#151515" : "#FFFFFF" },
          ]}
        >
          <View style={styles.heroContent}>
            <Animated.View
              style={[
                styles.logoWrap,
                { borderColor: isDark ? "#8B7BFF" : "#6A5AE0" },
                bobStyle,
              ]}
            >
              {logoSource ? (
                <Image
                  source={logoSource}
                  resizeMode="contain"
                  style={{ width: 40, height: 40 }}
                />
              ) : (
                <Text accessibilityLabel="logo" style={{ fontSize: 28 }}>
                  🃏
                </Text>
              )}
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.heroTitle,
                  { color: isDark ? "#fff" : "#0B0B0B" },
                ]}
              >
                Party starts here
              </Text>
              <Text style={styles.heroSubtitle}>{tagline}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <View style={{ gap: 12, width: "100%", marginTop: 20 }}>
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <Button
              onPress={() => {
                router.push("/create-game");
                toPhase("create");
                onCreateGame?.();
              }}
              title="Create Game"
              variant="primary"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Button
              onPress={() => {
                router.push("/join-game");
                toPhase("join");
                onJoinGame?.();
              }}
              title="Join Game"
              variant="secondary"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <Button
              onPress={onPassAndPlay}
              title="Pass & Play"
              variant="ghost"
            />
          </Animated.View>
        </View>

        {/* Links */}
        <View
          style={{
            alignItems: "center",
            marginTop: 18,
            flexDirection: "row",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/player-view")}
          >
            <Text style={styles.link}>How it works</Text>
          </Pressable>
          <Text style={{ opacity: 0.5 }}>|</Text>
          <Pressable accessibilityRole="button" onPress={() => {}}>
            <Text style={styles.link}>Settings</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />
        <Text style={styles.footer}>Built with ❤️ by kidfromjupiter</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
    gap: 12,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 12 },
  hero: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroContent: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 20,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    backgroundColor: "#ffffff",
  },
  heroTitle: { fontSize: 18, fontWeight: "700" },
  heroSubtitle: { fontSize: 14, color: "#777" },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  link: {
    fontSize: 14,
    textDecorationLine: "underline",
    opacity: 0.9,
    color: "#5c5c5cff",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 10,
    color: "#888",
  },
});

/**
 * Usage example:
 * <WelcomeScreen
 *   onCreateGame={() => navigation.navigate('CreateGame')}
 *   onJoinGame={() => navigation.navigate('JoinGame')}
 *   onPassAndPlay={() => navigation.navigate('PassPlay')}
 *   onHowToPlay={() => navigation.navigate('HowToPlay')}
 * />
 */
