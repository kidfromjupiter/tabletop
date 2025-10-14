import { StyleSheet, Text } from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  LinearTransition,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Item } from "./repeating-card-stack";

const PRESS_DURATION = 200;

export function ScrollableCard({
  data,
  style,
  scrollX,
  index,
  id,
  callback,
}: {
  data: Item;
  style?: any;
  scrollX: SharedValue<number>;
  index: number;
  id: string;
  callback: (id: string) => void;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const initialY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const gestureActive = useSharedValue(false);
  const flingGesture = Gesture.Fling()
    .direction(Directions.UP)
    .onStart((e) => {
      gestureActive.value = true;
      scale.value = withTiming(1.3, { duration: 225 });
      console.log("FLING");
      ty.value = withTiming(-e.y, { duration: 225 });
    })
    .onEnd(() => {
      gestureActive.value = false;
      opacity.value = withTiming(0, { duration: 300 });
      console.log("END FLING");
      runOnJS(callback)(id);
    });
  const animatedStyles = useAnimatedStyle(() => {
    initialY.value = interpolate(
      scrollX.value,
      [index - 1, index, index + 1],
      [20, 0, 20]
    );
    return {
      transform: [
        {
          translateY: initialY.value,
        },
      ],
    };
  });
  const gestureStyle = useAnimatedStyle(() => {
    return {
      zIndex: gestureActive.value ? 100 : 0,
      position: gestureActive.value ? "absolute" : "relative",
      left: 0,
      right: 0,
      opacity: opacity.value,
      transform: [
        { translateX: tx.value },
        { translateY: initialY.value + ty.value },
        { scale: scale.value },
      ],
    };
  });
  return (
    <GestureDetector gesture={flingGesture}>
      <Animated.View
        style={[
          styles.card,
          style,
          gestureStyle,
          animatedStyles,
          { borderColor: data.color, borderWidth: 2 },
        ]}
        layout={LinearTransition}
      >
        <Text>{data.title}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
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
  },
});
