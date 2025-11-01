import { StyleSheet, Text, View } from "react-native";
import { Button } from "./button";

export default function Counter({
  label,
  value,
  setValue,
  min,
  max,
  isDark,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
  isDark: boolean;
}) {
  function dec() {
    setValue(Math.max(min, value - 1));
  }
  function inc() {
    setValue(Math.min(max, value + 1));
  }
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={[styles.label, { color: isDark ? "#EDEDED" : "#333" }]}>
        {label}
      </Text>
      <View style={styles.rowBetween}>
        <Button
          onPress={dec}
          title="-"
          fullWidth={false}
          size="md"
          variant="secondary"
        />
        <Text
          style={[styles.counterValue, { color: isDark ? "#fff" : "#111" }]}
        >
          {value}
        </Text>
        <Button
          onPress={inc}
          title="+"
          fullWidth={false}
          size="md"
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepBtn: {
    width: 48,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 24, fontWeight: "800" },
  counterValue: {
    fontSize: 18,
    fontWeight: "800",
    minWidth: 48,
    textAlign: "center",
  },
});

/**
 * Usage:
 * <CreateGameScreen
 *   onBack={() => navigation.goBack()}
 *   onStart={(settings) => navigation.navigate('Lobby', { settings })}
 * />
 */
