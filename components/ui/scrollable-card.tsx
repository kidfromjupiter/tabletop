import { StyleSheet, Text } from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Item } from "./repeating-card-stack/types";

const PRESS_DURATION = 200;

export function ScrollableCard({
  data,
  style,
  scrollX,
  index,
  id,
  callback,
  rotation = 0,
  inverted = false,
  displayedRangeFromCenter = 1,
  yRange = 20,
  totalWidth,
}: {
  totalWidth: number;
  inverted?: boolean;
  data: Item;
  displayedRangeFromCenter?: number;
  style?: any;
  scrollX: SharedValue<number>;
  index: number;
  id: string;
  callback: (id: string) => void;
  rotation?: number;
  yRange?: number;
}) {
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
    let rot;
    if (!inverted) {
      initialY.value = interpolate(
        scrollX.value / totalWidth,
        [
          index - displayedRangeFromCenter,
          index,
          index + displayedRangeFromCenter,
        ],
        [yRange, 0, yRange],
        Extrapolation.CLAMP
      );
      rot = interpolate(
        scrollX.value / totalWidth,
        [
          index - displayedRangeFromCenter,
          index,
          index + displayedRangeFromCenter,
        ],
        [rotation, 0, -rotation]
      );
    } else {
      initialY.value = interpolate(
        scrollX.value / totalWidth,
        [
          index - displayedRangeFromCenter,
          index,
          index + displayedRangeFromCenter,
        ],
        [-yRange, 0, -yRange],
        Extrapolation.CLAMP
      );
      rot = interpolate(
        scrollX.value / totalWidth,
        [
          index - displayedRangeFromCenter,
          index,
          index + displayedRangeFromCenter,
        ],
        [-rotation, 0, rotation]
      );
    }
    return {
      zIndex: gestureActive.value ? 100 : 0,
      position: gestureActive.value ? "absolute" : "relative",
      left: 0,
      right: 0,
      opacity: opacity.value,
      elevation: gestureActive.value ? 4 : 0,
      transform: [
        {
          translateY: initialY.value + ty.value,
        },
        { rotate: `${rot}deg` },
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
          animatedStyles,
          { borderColor: data.color, borderWidth: 2 },
        ]}
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
