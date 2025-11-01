import Footer from "@/components/pages/lobby/footer";
import Header from "@/components/pages/lobby/header";
import PlayerCard from "@/components/pages/lobby/player-card";
import RoomCard from "@/components/pages/lobby/room-card";
import Rules from "@/components/pages/lobby/rules";
import ConfirmModal from "@/components/ui/modal";
import { useLobbyActions } from "@/hooks/useLobbyActions";
import { Player, useGameStore } from "@/lib/state";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { runOnJS } from "react-native-worklets";
/**
 * LobbyScreen.tsx
 * Pre-game lobby for a CAH-style tabletop game.
 * - Shows players, ready states, packs, rules summary, and host controls
 * - Works for host and non-host views via `isHost`
 * - Uses your reusable animated Button components
 */

export default function LobbyScreen({
  onToggleReady,
  onKick,
  onPromote,
  onShuffleJudges,
  onLeave,
  onToggleFamilyMode,
}: {
  onToggleReady?: (playerId: string) => void;
  onKick?: (playerId: string) => void;
  onPromote?: (playerId: string) => void; // promote to host
  onShuffleJudges?: () => void;
  onLeave?: () => void;
  onToggleFamilyMode?: (value: boolean) => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const {
    leaveRoom: leaveRoomAction,
    toggleReady: toggleReadyAction,
    startRound: startRoundAction,
  } = useLobbyActions();
  const [confirmVisible, setConfirmVisible] = useState(false);

  // zustand
  const players = useGameStore((state) => state.players); // --- IGNORE ---
  const meId = useGameStore((state) => state.me?.id || ""); // Ensure meId is always a string
  const isHost = useGameStore((state) => state.isHost); // --- IGNORE ---
  const settings = useGameStore((state) => state.settings); // --- IGNORE ---
  const setMe = useGameStore((state) => state.setMe);
  const setSettings = useGameStore((state) => state.updateSettings);

  const router = useRouter();

  const navigation = useNavigation();

  const allReady =
    players.length > 1 && players.every((p) => (p.isHost ? true : !!p.isReady));

  // Small pulsing animation for room code card
  const pulse = useSharedValue(1);
  useEffect(() => {
    let mounted = true;
    const loop = () => {
      pulse.value = withSpring(0.98, { stiffness: 120, damping: 14 }, (f) => {
        if (f && mounted)
          pulse.value = withSpring(1, { stiffness: 120, damping: 14 }, () =>
            runOnJS(loop)()
          );
      });
    };
    loop();
    return () => {
      mounted = false;
    };
  }, [pulse]);

  // subbing to supabase
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const headerFg = isDark ? "#fff" : "#0B0B0B";

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", async (e: any) => {
      if (!navigation.canGoBack()) {
        // sometimes there's no nav stack for whatever reason. We're handling it manually
        await leaveRoomAction();
      }
      if (e.data.action.type !== "GO_BACK") return; // Allow non-back navigations
      e.preventDefault(); // stop the default behavior
      setConfirmVisible(true);
    });
    return unsub;
  }, []);
  if (!meId) {
    return null;
  }

  function renderPlayer({ item }: { item: Player }) {
    return (
      <PlayerCard
        item={item}
        isDark={isDark}
        meId={meId}
        isHost={isHost}
        onToggleReady={onToggleReady}
        onPromote={onPromote}
        onKick={onKick}
      />
    );
  }

  const copyToClipboard = () => {
    // new API is async-friendly. But using async makes button flicker
    Clipboard.setStringAsync(settings.roomCode);
  };
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      <ScrollView>
        <Header title="Lobby" isDark={isDark} />

        <RoomCard
          settings={settings}
          isDark={isDark}
          pulseStyle={pulseStyle}
          headerFg={headerFg}
          onCopyInvite={copyToClipboard}
        />

        <Animated.View
          entering={FadeIn.springify()}
          style={[
            styles.sectionCard,
            { backgroundColor: isDark ? "#151515" : "#fff" },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: headerFg }]}>
              Players ({players.length})
            </Text>
            {/* {isHost && (
              <Pressable onPress={onShuffleJudges}>
                <Text
                  style={[
                    styles.link,
                    { color: isDark ? "#EDEDED" : "#4B3EF7" },
                  ]}
                >
                  Shuffle judge order
                </Text>
              </Pressable>
            )} */}
          </View>
          <FlatList
            data={players}
            keyExtractor={(p) => p.id}
            renderItem={renderPlayer}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 8 }}
          />
        </Animated.View>

        <Rules
          settings={settings}
          isDark={isDark}
          headerFg={headerFg}
          onToggleFamilyMode={onToggleFamilyMode}
        />

        <Footer
          isHost={isHost}
          allReady={allReady}
          players={players}
          meId={meId}
          onStart={startRoundAction}
          onToggleReady={toggleReadyAction}
        />
      </ScrollView>

      <ConfirmModal
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={leaveRoomAction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "800" },
  roomCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  roomCodeLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  roomCode: { fontSize: 28, fontWeight: "900", letterSpacing: 2, marginTop: 2 },
  roomMetaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
  },
  dot: { fontSize: 14 },

  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800" },

  playerRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: { fontSize: 22 },
  playerName: { fontSize: 16, fontWeight: "700" },
  subtle: { fontSize: 12 },

  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  ruleKey: { fontSize: 14, fontWeight: "600", opacity: 0.9 },
  ruleVal: { fontSize: 14, fontWeight: "700" },

  footerBar: { paddingHorizontal: 16, paddingBottom: 16 },
  link: { fontSize: 14, fontWeight: "600" },
});
