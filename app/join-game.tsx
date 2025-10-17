import { Button, IconButton } from "@/components/ui/button"; // use latest buttons file name
import { useGameStore } from "@/lib/state";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * JoinGameScreen.tsx
 * Join flow for a CAH-style game. Uses your reusable Button/IconButton.
 * - Enter Room Code + Display Name
 * - Optional: paste code / scan QR (callbacks)
 * - Rejoin previous session shortcut
 */

export type JoinGameProps = {
  onBack?: () => void;
  onJoin?: (payload: { roomCode: string; name: string }) => void;
  onRejoin?: (last: { roomCode: string; name: string }) => void;
  onPasteCode?: () => Promise<string | undefined> | string | undefined; // return code string
  onScanQr?: () => Promise<string | undefined> | string | undefined; // return code string
  defaultName?: string;
  defaultCode?: string;
  lastSession?: { roomCode: string; name: string } | null;
  isBusy?: boolean; // disable inputs on network ops
};

export default function JoinGameScreen({
  onBack,
  onJoin,
  onRejoin,
  onPasteCode,
  onScanQr,
  defaultName = "",
  defaultCode = "",
  lastSession = null,
  isBusy = false,
}: JoinGameProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // zustand
  const toPhase = useGameStore((state) => state.toPhase);
  const joinRoom = useGameStore((state) => state.joinRoom);
  const roomName = useGameStore((state) => state.settings?.roomCode);
  const displayName = useGameStore((state) => state.me?.name);

  const [name, setName] = React.useState(displayName || defaultName);
  const [code, setCode] = React.useState(
    (roomName || defaultCode || "").toUpperCase()
  );
  const [error, setError] = React.useState<string | null>(null);

  const cardIn = useSharedValue(0);
  React.useEffect(() => {
    cardIn.value = 0;
    cardIn.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, []);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardIn.value,
    transform: [{ translateY: (1 - cardIn.value) * 10 }],
  }));

  const router = useRouter();

  async function handleJoin() {
    const trimmed = name.trim();
    const c = code.trim();
    setError(null);
    if (!c || c.length < 4) {
      setError("Room code must be 4–8 characters.");
      return;
    }
    if (!trimmed) {
      setError("Please enter a display name.");
      return;
    }
    toPhase("lobby");
    joinRoom(c.toUpperCase(), trimmed);
    onJoin?.({ roomCode: c.toUpperCase(), name: trimmed });
  }

  async function handlePaste() {
    try {
      const value =
        typeof onPasteCode === "function" ? await onPasteCode() : undefined;
      if (value) setCode(value.toUpperCase().slice(0, 8));
    } catch (e) {
      Alert.alert("Paste failed", "Couldn't read from clipboard.");
    }
  }

  async function handleScan() {
    try {
      const value =
        typeof onScanQr === "function" ? await onScanQr() : undefined;
      if (value) setCode(value.toUpperCase().slice(0, 8));
    } catch (e) {
      Alert.alert("Scan failed", "Camera/QR scan was unsuccessful.");
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      {/* Header */}
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
          Join Game
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Card */}
      <Animated.View
        entering={FadeInDown.springify()}
        style={[
          styles.card,
          { backgroundColor: isDark ? "#151515" : "#FFFFFF" },
          cardStyle,
        ]}
      >
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Room
        </Text>

        <Text style={[styles.label, { color: isDark ? "#EDEDED" : "#333" }]}>
          Room code
        </Text>
        <View style={styles.row}>
          <TextInput
            value={code}
            onChangeText={(t) =>
              setCode(t.toUpperCase().replace(/\s/g, "").slice(0, 8))
            }
            autoCapitalize="characters"
            placeholder="ABCD5"
            placeholderTextColor={isDark ? "#777" : "#999"}
            style={[
              styles.input,
              {
                flex: 1,
                color: isDark ? "#fff" : "#111",
                backgroundColor: isDark ? "#1E1E1E" : "#F3F3F4",
                borderColor: isDark ? "#2C2C2C" : "#E4E4E7",
              },
            ]}
            editable={!isBusy}
          />
          {onPasteCode ? (
            <Pressable
              onPress={handlePaste}
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
                Paste
              </Text>
            </Pressable>
          ) : null}
          {onScanQr ? (
            <Pressable
              onPress={handleScan}
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
                Scan
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.label, { color: isDark ? "#EDEDED" : "#333" }]}>
          Display name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={isDark ? "#777" : "#999"}
          style={[
            styles.input,
            {
              color: isDark ? "#fff" : "#111",
              backgroundColor: isDark ? "#1E1E1E" : "#F3F3F4",
              borderColor: isDark ? "#2C2C2C" : "#E4E4E7",
            },
          ]}
          editable={!isBusy}
        />

        {error ? (
          <Animated.Text
            entering={FadeInUp.springify()}
            style={[styles.error, { color: isDark ? "#FCA5A5" : "#DC2626" }]}
          >
            {error}
          </Animated.Text>
        ) : null}

        {/* Primary CTA */}
        <View style={{ marginTop: 8 }}>
          <Button
            title={isBusy ? "Joining…" : "Join Game"}
            onPress={handleJoin}
            disabled={isBusy}
          />
        </View>

        {/* Rejoin */}
        {lastSession ? (
          <View style={{ marginTop: 12 }}>
            <Button
              title={`Rejoin ${lastSession.roomCode}`}
              variant="secondary"
              onPress={() => onRejoin?.(lastSession)}
            />
          </View>
        ) : null}
      </Animated.View>

      {/* Help text */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text
          style={{
            textAlign: "center",
            fontSize: 12,
            color: isDark ? "#9CA3AF" : "#6B7280",
          }}
        >
          Ask your host for the 4–8 character room code. Names are visible to
          other players.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// -------------- styles --------------
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
  card: {
    margin: 16,
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
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  smallButton: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  error: { marginTop: 4, fontSize: 13, fontWeight: "700" },
});

/**
 * Usage
 * <JoinGameScreen
 *   defaultName="Alex"
 *   onBack={() => navigation.goBack()}
 *   onJoin={({ roomCode, name }) => api.join(roomCode, name)}
 *   onRejoin={(last) => api.rejoin(last.roomCode)}
 *   onPasteCode={async () => Clipboard.getString()}
 *   onScanQr={() => scanQr()}
 *   lastSession={{ roomCode: 'ABCD5', name: 'Alex' }}
 * />
 */
