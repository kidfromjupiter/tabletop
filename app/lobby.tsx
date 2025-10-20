import PlayerCard from "@/components/pages/lobby/player-card";
import RoomCard from "@/components/pages/lobby/room-card";
import Rules from "@/components/pages/lobby/rules";
import { Button, IconButton } from "@/components/ui/button";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/constants/supabase";
import { useGameStore } from "@/lib/state";
import { Ionicons } from "@expo/vector-icons";
import {
  createClient,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import * as React from "react";
import { useEffect } from "react";
import {
  FlatList,
  Pressable,
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

export type Player = {
  id: string;
  name: string;
  isHost?: boolean;
  isReady?: boolean;
  avatar?: string; // URL or emoji text
};

export type LobbySettings = {
  roomCode: string;
  isPrivate: boolean;
  familyMode: boolean;
  roundLimit: number; // 0 = unlimited
  scoreLimit: number; // 0 = unlimited
  handSize: number;
  packs: string[]; // names/ids
};

export default function LobbyScreen({
  onStart,
  onToggleReady,
  onKick,
  onPromote,
  onShuffleJudges,
  onCopyInvite,
  onLeave,
  onToggleFamilyMode,
}: {
  onStart?: () => void;
  onToggleReady?: (playerId: string) => void;
  onKick?: (playerId: string) => void;
  onPromote?: (playerId: string) => void; // promote to host
  onShuffleJudges?: () => void;
  onCopyInvite?: () => void;
  onLeave?: () => void;
  onToggleFamilyMode?: (value: boolean) => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // zustand
  const players = useGameStore((state) => state.players); // --- IGNORE ---
  const setPlayers = useGameStore((state) => state.setPlayers); // --- IGNORE ---
  const addPlayer = useGameStore((state) => state.addPlayer); // --- IGNORE ---
  const updatePlayer = useGameStore((state) => state.updatePlayer); // --- IGNORE ---
  const removePlayer = useGameStore((state) => state.removePlayer); // --- IGNORE ---
  const meId = useGameStore((state) => state.me?.id || ""); // Ensure meId is always a string
  const isHost = useGameStore((state) => state.isHost); // --- IGNORE ---
  const settings = useGameStore((state) => state.settings); // --- IGNORE ---

  const router = useRouter();

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
  useEffect(() => {
    (async () => {
      setPlayers([]); // reset on mount
      // Pull current state (join profiles for richer UI)
      const { data, error } = await supabase
        .from("room_players")
        .select(
          `
    room_id, user_id, role, is_ready, score, joined_at,
    profiles ( display_name, avatar ),
    rooms!inner ( code )
  `
        )
        .eq("rooms.code", settings?.roomCode) // filter on joined table
        .order("joined_at", { ascending: true });
      console.log("Lobby players fetch:", data, error);
      if (!error && data) {
        const mapped: Player[] = data.map((r: any) => ({
          id: r.user_id,
          name: r.profiles.display_name,
          avatar: r.profiles.avatar,
          isHost: r.role === "host",
          isReady: r.is_ready,
        }));
        setPlayers(mapped);
      }
    })();
  }, [settings?.roomCode]);

  // subbing to supabase
  useEffect(() => {
    (async () => {
      let room_id = "";
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("*")
          .eq("code", settings?.roomCode)
          .single();

        if (!error && data) {
          room_id = data.id;
        }

        const supabaseChannel = supabase.channel("schema-db-changes").on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_players",
            filter: `room_id=eq.${room_id}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            (async () => {
              const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", payload.new.user_id)
                .single();

              if (payload.eventType === "INSERT") {
                const newPlayer = payload.new;
                addPlayer({
                  id: newPlayer.user_id,
                  name: data.display_name,
                  isHost: newPlayer.role == "host",
                  isReady: newPlayer.is_ready,
                  avatar: data.avatar,
                });
              }
              if (payload.eventType === "UPDATE") {
                const updatedPlayer = payload.new;
                updatePlayer(updatedPlayer.user_id, {
                  name: data.display_name,
                  isHost: updatedPlayer.role == "host",
                  isReady: updatedPlayer.is_ready,
                  avatar: data.avatar,
                });
              }
              if (payload.eventType === "DELETE") {
                const deletedPlayer = payload.old;
                removePlayer(deletedPlayer.user_id);
              }
            })();
          }
        );
        supabaseChannel.subscribe();

        return () => {
          supabaseChannel.unsubscribe();
        };
      } catch (err) {
        console.error("Error in useEffect async function:", err);
      }
    })();
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const headerFg = isDark ? "#fff" : "#0B0B0B";
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

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            variant="ghost"
            onPress={() => {
              router.back();
            }}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color="currentColor"
            />
          </IconButton>
          <Text style={[styles.title, { color: headerFg }]}>Lobby</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Room Card */}
        <RoomCard
          settings={settings}
          isDark={isDark}
          pulseStyle={pulseStyle}
          headerFg={headerFg}
          onCopyInvite={onCopyInvite}
        />

        {/* Players */}
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
            {isHost ? (
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
            ) : null}
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

        {/* Rules & Packs Summary */}
        <Rules
          settings={settings}
          isDark={isDark}
          headerFg={headerFg}
          onToggleFamilyMode={onToggleFamilyMode}
        />

        {/* Footer controls */}
        <View style={{ height: 12 }} />
        <View style={styles.footerBar}>
          {isHost ? (
            <Button title="Start Game" onPress={onStart} disabled={!allReady} />
          ) : (
            <Button
              title={
                players.find((p) => p.id === meId)?.isReady
                  ? "Unready"
                  : "I'm Ready"
              }
              variant={
                players.find((p) => p.id === meId)?.isReady
                  ? "secondary"
                  : "primary"
              }
              onPress={() => onToggleReady?.(meId)}
            />
          )}
        </View>
      </ScrollView>
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

/**
 * Usage
 * <LobbyScreen
 *   isHost={true}
 *   players={[{id:'1', name:'Kavi', isHost:true, isReady:true},{id:'2', name:'Alex', isReady:false}]}
 *   meId={'1'}
 *   settings={{ roomCode:'ABCD5', isPrivate:true, familyMode:false, roundLimit:8, scoreLimit:10, handSize:10, packs:['Base','Party'] }}
 *   onStart={() => navigation.navigate('Round')}
 *   onToggleReady={(id)=>{}}
 *   onKick={(id)=>{}}
 *   onPromote={(id)=>{}}
 *   onShuffleJudges={()=>{}}
 *   onCopyInvite={()=>{}}
 *   onLeave={()=> navigation.goBack()}
 *   onToggleFamilyMode={(v)=>{}}
 * />
 */
