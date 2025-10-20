import { Button, IconButton } from "@/components/ui/button";
import Counter from "@/components/ui/counter";
import { Toggle } from "@/components/ui/toggle";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/constants/supabase";
import { GameSettings, useGameStore } from "@/lib/state";
import { Ionicons } from "@expo/vector-icons";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * CreateGameScreen.tsx
 * Single-file, no custom reusable components. Pure RN + small Reanimated touches.
 * Host can set: display name, room code, public/private, family filter, packs, limits.
 * Emits onStart(settings) with a normalized config object.
 */

export default function CreateGameScreen({
  onBack,
  defaultName = "",
}: {
  onBack?: () => void;
  defaultName?: string;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // ---------------- State ----------------
  const [hostName, setHostName] = React.useState(defaultName);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const setMe = useGameStore((state) => state.setMe);
  const roomCode = useGameStore((state) => state.settings.roomCode);
  const isPrivate = useGameStore((state) => state.settings.isPrivate);
  const familyMode = useGameStore((state) => state.settings.familyMode);
  const roundLimit = useGameStore((state) => state.settings.roundLimit);
  const scoreLimit = useGameStore((state) => state.settings.scoreLimit);
  const handSize = useGameStore((state) => state.settings.handSize);
  const selectedPacks = useGameStore((state) => state.settings.packs);
  // const [roomCode, setRoomCode] = React.useState(makeRoomCode());
  // const [isPrivate, setIsPrivate] = React.useState(true);
  // const [familyMode, setFamilyMode] = React.useState(false);
  // const [roundLimit, setRoundLimit] = React.useState(8);
  // const [scoreLimit, setScoreLimit] = React.useState(10);
  // const [handSize, setHandSize] = React.useState(10);
  // const [selectedPacks, setSelectedPacks] = React.useState<string[]>(["base"]);

  // Demo pack list (IDs + human labels). Replace with your real catalog.
  const packs = React.useMemo(
    () => [
      { id: "base", name: "Base" },
      { id: "party", name: "Party Pack" },
      { id: "family", name: "Family Pack" },
      { id: "nsfw", name: "NSFW Pack" },
      { id: "custom", name: "Your Custom Pack" },
    ],
    []
  );

  // ---------------- Handlers ----------------
  function togglePack(id: string) {
    updateSettings({
      packs: selectedPacks.includes(id)
        ? selectedPacks.filter((p) => p !== id)
        : [...selectedPacks, id],
    });
  }

  async function handleStart() {
    if (!hostName.trim()) {
      Alert.alert("Missing name", "Please enter your display name.");
      return;
    }
    if (!roomCode.trim() || roomCode.length < 4) {
      Alert.alert("Room code", "Use a 4–8 character room code.");
      return;
    }
    if (selectedPacks.length === 0) {
      Alert.alert("No packs selected", "Pick at least one pack to play.");
      return;
    }

    // Safety: if familyMode, drop NSFW pack if user left it on
    const normalized = familyMode
      ? selectedPacks.filter((p) => p !== "nsfw")
      : selectedPacks;

    const settings: GameSettings = {
      roomCode: roomCode.toUpperCase(),
      isPrivate,
      familyMode,
      roundLimit: Math.max(0, roundLimit),
      scoreLimit: Math.max(0, scoreLimit),
      handSize: Math.max(4, Math.min(15, handSize)),
      packs: Array.from(new Set(normalized)),
    };
    const { data, error } = await supabase.functions.invoke("endpoints", {
      body: {
        action: "create_room",
        payload: {
          code: settings.roomCode,
          is_private: settings.isPrivate,
          family_mode: settings.familyMode,
          round_limit: settings.roundLimit,
          score_limit: settings.scoreLimit,
          hand_size: settings.handSize,
          display_name: hostName.trim(),
        },
      },
    });
    setMe({
      id: data.room.host_id,
      name: hostName.trim(),
    });

    console.log("Create room response:", data, error);

    updateSettings(settings);
    router.push("/lobby");
  }

  function regenerateCode() {
    updateSettings({ roomCode: makeRoomCode() });
    //setRoomCode(makeRoomCode());
  }
  const router = useRouter();

  // ---------------- Render ----------------
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      <View style={styles.header}>
        <IconButton
          variant="ghost"
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="arrow-back-outline" size={24} color="currentColor" />
        </IconButton>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#0B0B0B" }]}>
          Create Game
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Host & Room */}
        <Animated.View
          entering={FadeInDown.springify()}
          style={[
            styles.card,
            { backgroundColor: isDark ? "#151515" : "#fff" },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
          >
            Host & Room
          </Text>

          <Text style={[styles.label, { color: isDark ? "#EDEDED" : "#333" }]}>
            Display name
          </Text>
          <TextInput
            placeholder="Your name"
            placeholderTextColor={isDark ? "#777" : "#999"}
            value={hostName}
            onChangeText={setHostName}
            style={[
              styles.input,
              {
                color: isDark ? "#fff" : "#111",
                backgroundColor: isDark ? "#1E1E1E" : "#F3F3F4",
                borderColor: isDark ? "#2C2C2C" : "#E4E4E7",
              },
            ]}
          />

          <View style={styles.rowBetween}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text
                style={[styles.label, { color: isDark ? "#EDEDED" : "#333" }]}
              >
                Room code
              </Text>
              <TextInput
                value={roomCode}
                onChangeText={(t) =>
                  updateSettings({ roomCode: t.toUpperCase().slice(0, 8) })
                }
                autoCapitalize="characters"
                style={[
                  styles.input,
                  {
                    color: isDark ? "#fff" : "#111",
                    backgroundColor: isDark ? "#1E1E1E" : "#F3F3F4",
                    borderColor: isDark ? "#2C2C2C" : "#E4E4E7",
                  },
                ]}
              />
            </View>
            <Pressable
              onPress={regenerateCode}
              style={[
                styles.smallButton,
                { backgroundColor: isDark ? "#2A2A2A" : "#EDEBFF" },
              ]}
            >
              <Text
                style={{
                  fontWeight: "700",
                  color: isDark ? "#EDEDED" : "#4B3EF7",
                }}
              >
                New
              </Text>
            </Pressable>
          </View>

          <View style={styles.rowBetween}>
            <Toggle
              label="Private room"
              value={isPrivate}
              onToggle={() => updateSettings({ isPrivate: !isPrivate })}
              isDark={isDark}
            />
            <Toggle
              label="Family mode"
              value={familyMode}
              onToggle={() => updateSettings({ familyMode: !familyMode })}
              isDark={isDark}
            />
          </View>
        </Animated.View>

        {/* Rules */}
        <Animated.View
          entering={FadeInDown.delay(60).springify()}
          style={[
            styles.card,
            { backgroundColor: isDark ? "#151515" : "#fff" },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
          >
            Rules
          </Text>
          <Counter
            label="Round limit (0 = unlimited)"
            value={roundLimit}
            setValue={() => {
              updateSettings({ roundLimit });
            }}
            min={0}
            max={30}
            isDark={isDark}
          />
          <Counter
            label="Score limit (0 = unlimited)"
            value={scoreLimit}
            setValue={() => {
              updateSettings({ scoreLimit });
            }}
            min={0}
            max={30}
            isDark={isDark}
          />
          <Counter
            label="Hand size"
            value={handSize}
            setValue={() => updateSettings({ handSize })}
            min={5}
            max={15}
            isDark={isDark}
          />
        </Animated.View>

        {/* Packs */}
        <Animated.View
          entering={FadeInDown.delay(120).springify()}
          style={[
            styles.card,
            { backgroundColor: isDark ? "#151515" : "#fff" },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
          >
            Packs
          </Text>
          <View style={styles.chipsWrap}>
            {packs.map((p) => {
              const active = selectedPacks.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => togglePack(p.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? isDark
                          ? "#8B7BFF"
                          : "#6A5AE0"
                        : isDark
                          ? "#222"
                          : "#F1F1F3",
                      borderColor: isDark ? "#2C2C2C" : "#E4E4E7",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active
                        ? isDark
                          ? "#0B0B0B"
                          : "#fff"
                        : isDark
                          ? "#EDEDED"
                          : "#222",
                      fontWeight: "600",
                    }}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {familyMode && selectedPacks.includes("nsfw") && (
            <Text
              style={{ color: isDark ? "#F1C40F" : "#8a6d3b", marginTop: 6 }}
            >
              Family mode is on: NSFW pack will be disabled at start.
            </Text>
          )}
        </Animated.View>

        {/* Start */}
        <Animated.View entering={FadeIn.delay(180)}>
          <Button title="Start Game" variant="primary" onPress={handleStart} />
          <Text
            style={[styles.hint, { color: isDark ? "#9CA3AF" : "#6B7280" }]}
          >
            You can change packs and rules later in Host Controls.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// -------------- Tiny in-file helpers (not exported) --------------
function makeRoomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude I/O/1/0 for readability
  let s = "";
  for (let i = 0; i < 5; i++)
    s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}

// -------------- Styles --------------
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  container: {
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "800" },
  link: { fontSize: 16, textDecorationLine: "underline" },
  card: {
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallButton: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  hint: { textAlign: "center", marginBottom: 16 },
});

/**
 * Usage:
 * <CreateGameScreen
 *   onBack={() => navigation.goBack()}
 *   onStart={(settings) => navigation.navigate('Lobby', { settings })}
 * />
 */
