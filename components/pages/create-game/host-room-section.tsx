import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { useGameStore } from "@/lib/state";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function HostRoomSection({
  hostName,
  setHostName,
  isDark,
  regenerateCode,
}: {
  hostName: string;
  setHostName: (name: string) => void;
  isDark: boolean;
  regenerateCode: () => void;
}) {
  const roomCode = useGameStore((state) => state.settings.roomCode);
  const isPrivate = useGameStore((state) => state.settings.isPrivate);
  const familyMode = useGameStore((state) => state.settings.familyMode);
  const updateSettings = useGameStore((state) => state.updateSettings);

  return (
    <View
      style={[styles.card, { backgroundColor: isDark ? "#151515" : "#fff" }]}
    >
      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}>
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
          <Text style={[styles.label, { color: isDark ? "#EDEDED" : "#333" }]}>
            Room code
          </Text>

          <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 3 }}>
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
            <Button
              title="New"
              onPress={regenerateCode}
              fullWidth={false}
              //size="sm"
              variant="secondary"
            />
          </View>
        </View>
        {/* <Pressable
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
        </Pressable> */}
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
    </View>
  );
}

const styles = StyleSheet.create({
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
});
