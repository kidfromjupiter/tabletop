import React from "react";
import { StyleSheet, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export type DraggableItem = {
  id: string;
  title: string;
  color?: string;
};

export function DraggableCard({
  item,
  onDrop,
}: {
  item: DraggableItem;
  onDrop: (item: DraggableItem) => void;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange((e) => {
      tx.value += e.changeX;
      ty.value += e.changeY;
    })
    .onEnd(() => {
      // simple drop heuristic: if user drags upwards beyond threshold, treat as drop
      if (ty.value < -100) {
        runOnJS(onDrop)(item);
        tx.value = 0;
        ty.value = 0;
      } else {
        tx.value = withSpring(0);
        ty.value = withSpring(0);
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    zIndex: ty.value < -20 ? 10 : 1,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.card, style, { backgroundColor: item.color || "#fff" }]}
      >
        <Text style={{ color: "#111", fontWeight: "700" }}>{item.title}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 200,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderColor: "#dbdbdbff",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
