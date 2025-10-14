import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function CardStack({ keyProp = 0 }: { keyProp?: number }) {
  // Render 3 cards, each with its own key so they reset when keyProp changes
  const [cards, setCards] = React.useState([1, 2, 3]);
  const popAndAdd = () => {
    //remove from the back and add to the front
    setCards((c) => {
      const newCards = [...c];
      newCards.pop();
      newCards.unshift((newCards[0] ?? 0) + 1);
      return newCards;
    });
  };
  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        flex: 2,
      }}
    >
      {cards.map((c, i) => (
        <Card
          key={`${keyProp}-${c}`}
          index={i}
          data={c}
          onSwipeEnd={popAndAdd}
        />
      ))}
    </View>
  );
}

// Single card, unchanged
export function Card({
  index,
  data,
  onSwipeEnd,
}: {
  index: number;
  data?: any;
  onSwipeEnd?: () => void;
}) {
  console.log("Render card", index, data);
  // X offset of this card

  const offset = useSharedValue<number>(0);
  const panGesture = Gesture.Pan()
    .onChange((event) => {
      offset.value += event.changeX;
    })
    .onBegin(() => {
      console.log("BEGIN");
    })
    .onFinalize(() => {
      if (Math.abs(offset.value) > 100) {
        offset.value = offset.value > 0 ? withSpring(500) : withSpring(-500);
        if (onSwipeEnd) {
          runOnJS(onSwipeEnd)();
        }
      } else {
        offset.value = withSpring(0);
      }
    });

  const animatedStyles = useAnimatedStyle(() => {
    // Rotate up to 25deg for large drags, relative to base
    const rotate = (offset.value / 300) * 25;
    return {
      transform: [{ translateX: offset.value }, { rotate: `${rotate}deg` }],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.card, animatedStyles]}
        entering={FadeIn}
        exiting={FadeOut}
        key={index}
      >
        <Text style={{ color: "black", fontSize: 50 }}>{data}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    //    alignSelf: "center",
  },
});
