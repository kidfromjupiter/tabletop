//import RepeatingCardStack, { Item } from "@/components/ui/repeating-card-stack";
//import RepeatingCardStack from "@/components/ui/repeating-card-stack";
import { Item } from "@/components/ui/repeating-card-stack/types";
import { ScrollableCard } from "@/components/ui/scrollable-card";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import RepeatingCardStack from "../components/ui/repeating-card-stack";

const { width } = Dimensions.get("screen");
const CARD_WIDTH = width * 0.45;

const data: Item[] = [
  { id: "1", title: "Card 1", color: "#ffadad" },
  // { id: "2", title: "Card 2", color: "#ffd6a5" },
  // { id: "3", title: "Card 3", color: "#fdffb6" },
];

const handData: Item[] = [
  { id: "6", title: "Card 6", color: "#8b2525ff" },
  { id: "7", title: "Card 7", color: "#e7942eff" },
  { id: "8", title: "Card 8", color: "#0ec98aff" },
];
export default function App() {
  const [cards, setCards] = useState(data);
  const [hand, setHand] = useState(handData);

  const scrollX = useSharedValue<number>(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x / (CARD_WIDTH + 5);
  });

  const removeById = (id: string) => {
    const item = hand.find((item) => item.id === id);
    addToStack(item!);
    setHand((prev) => prev.filter((item) => item.id !== id));
  };
  const addToStack = (item: Item) => {
    setCards((prev) => [...prev, item]);
  };

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <StatusBar style="light" />

        <View style={{ flex: 1, width: "100%", justifyContent: "center" }}>
          <RepeatingCardStack data={cards} cardHeight={300} />
        </View>

        <View
          style={{
            flex: 1,
            width: "100%",
            overflow: "visible",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Animated.FlatList
            data={hand}
            contentContainerStyle={{
              paddingHorizontal: (width - CARD_WIDTH) / 2,
              gap: 5,
              alignItems: "center",
            }}
            snapToInterval={CARD_WIDTH + 5}
            horizontal
            decelerationRate={"fast"}
            keyExtractor={(item) => item.id}
            // Animate item reflow on insert/remove/reorder
            itemLayoutAnimation={LinearTransition.springify()
              .damping(15)
              .stiffness(450)
              .mass(0.6)}
            renderItem={({ item, index }) => (
              <Animated.View
                // This layout prop lets siblings reflow smoothly when items are removed.
                layout={LinearTransition.springify()
                  .damping(12)
                  .stiffness(500)
                  .mass(0.4)}
                style={{ width: CARD_WIDTH }}
                entering={FadeIn}
                exiting={FadeOut}
              >
                <ScrollableCard
                  data={item}
                  style={{
                    width: "100%",
                    overflow: "visible",
                  }}
                  scrollX={scrollX}
                  index={index}
                  id={item.id}
                  callback={removeById}
                />
              </Animated.View>
            )}
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            removeClippedSubviews={false}
            scrollEventThrottle={16}
          />
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
    height: 200,
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
