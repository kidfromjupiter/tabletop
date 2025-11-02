import LottieView from "@/components/compat-shims/lottie";
import { Button, IconButton } from "@/components/ui/button";
import { PaperModal } from "@/components/ui/paper-modal";
import { useGameStore } from "@/lib/state";
import supabase from "@/lib/supabase";
import { showToast } from "@/lib/toast";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as Updates from "expo-updates";
import * as React from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
const { height } = Dimensions.get("window");
export default function WelcomeScreen({
  onCreateGame,
  onJoinGame,
  onPassAndPlay,
  onHowToPlay,
  appName = "Tabletop",
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
  const [centerOpen, setCenterOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const room_code = useGameStore((state) => state.settings.roomCode);
  const me_id = useGameStore((state) => state.me?.id);
  const [gameResumeNextScreen, setGameResumeNextScreen] = React.useState<
    "judge-view" | "player-view" | "lobby" | null
  >(null);
  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        showToast(" Update available! Downloading...");
        await Updates.fetchUpdateAsync();

        showToast("Reloading to apply update...");
        await Updates.reloadAsync();
      } else {
        showToast("You have the latest version!");
      }
    } catch (error) {
      // You can also add an alert() to see the error message in case of an error when fetching updates.
      alert(`Error fetching latest Expo update: ${error}`);
    }
  }

  // tiny bob animation for logo
  const bob = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      bob.value = withSpring(1, { stiffness: 60, damping: 8 });
    }, [bob])
  );
  const [ranRoomStatusCheck, setRanRoomStatusCheck] = React.useState(false);
  React.useEffect(() => {
    if (room_code && me_id && !ranRoomStatusCheck) {
      console.log(`calling backend this with ${room_code}, ${me_id}`);
      (async () => {
        const { data: roomState } = await supabase.functions.invoke(
          "endpoints",
          {
            body: {
              action: "room_state",
              payload: {
                room_code: room_code,
                user_id: me_id,
              },
            },
          }
        );
        if (!roomState.ended_at && !roomState.round) {
          // room hasn't ended. game is still going. No round tho
          setGameResumeNextScreen("lobby");
          setSheetOpen(true);
          console.log("Hasn't ended Going to lobby");
        } else {
          if (roomState.round.judge_user_id === me_id) {
            setGameResumeNextScreen("judge-view");
            setSheetOpen(true);
          } else {
            setGameResumeNextScreen("player-view");
            setSheetOpen(true);
          }
        }
        setRanRoomStatusCheck(true);
      })();
    }
  }, [room_code, me_id]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value * -4 }],
  }));

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F5F5F7" }]}
    >
      <GestureHandlerRootView>
        <View style={styles.container}>
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(250)}
            style={styles.headerRow}
          >
            <Text
              style={[
                styles.title,
                { color: isDark ? "#fff" : "#0B0B0B" },
                { marginTop: Platform.OS == "web" ? 20 : 0 },
              ]}
            >
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
          <LottieView
            source={require("../assets/lottie/welcome.json")}
            style={{ width: "100%", height: height * 0.5 }}
            autoPlay
            speed={0.6}
            loop
            resizeMode="cover"
          />
          {/* Actions */}
          <View style={{ gap: 12, width: "100%", marginTop: -80 }}>
            <Animated.View entering={FadeInDown.delay(60).springify()}>
              <Button
                onPress={() => {
                  router.navigate("/create-game");
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
                  router.navigate("/join-game");
                  toPhase("join");
                  onJoinGame?.();
                }}
                title="Join Game"
                variant="secondary"
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
            {/* <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/winner-screen")}
            >
              <Text style={styles.link}>winner</Text>
            </Pressable> */}
            {/* <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/judge-view")}
            >
              <Text style={styles.link}>Judge view</Text>
            </Pressable>
            <Text style={{ opacity: 0.5 }}>|</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/round-results")}
            >
              <Text style={styles.link}>results</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/reveal-sequence")}
            >
              <Text style={styles.link}>Reveal Sequence</Text>
            </Pressable> */}
          </View>

          <View style={{ flex: 1 }} />
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <IconButton onPress={onFetchUpdateAsync} variant="ghost">
              <Ionicons name="refresh" size={24} color="white" />
            </IconButton>
          </View>
          <Text style={styles.footer}>
            Built for shits and giggles by kidfromjupiter
          </Text>
        </View>
        <PaperModal
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
          variant="bottom"
          enablePanToClose
          contentStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              margin: 16,
              color: "white",
            }}
          >
            There's already a game in progress! Do you want to resume?
          </Text>
          <View style={{ paddingHorizontal: 16 }}>
            <Button
              title="Yes"
              onPress={() => {
                if (gameResumeNextScreen) {
                  router.navigate(`/${gameResumeNextScreen}`);
                  setSheetOpen(false);
                }
              }}
            />
          </View>
        </PaperModal>
      </GestureHandlerRootView>
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
