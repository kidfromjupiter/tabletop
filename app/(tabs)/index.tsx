import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Button, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  const [resetKey, setResetKey] = useState(0);
  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <StatusBar style="light" />
        {/* <CardStack keyProp={resetKey} /> */}
        <View
          style={{
            position: "absolute",
            bottom: 40,
            width: "100%",
            alignItems: "center",
          }}
        >
          <Button title="Reset" onPress={() => setResetKey((k) => k + 1)} />
        </View>
        <View>
          <View style={styles.card}></View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c4c4c4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    height: 350,
    aspectRatio: 3 / 4,
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderColor: "#dbdbdbff",
    borderWidth: 1,
    position: "absolute",
  },
});
