//import RepeatingCardStack, { Item } from "@/components/ui/repeating-card-stack";
//import RepeatingCardStack from "@/components/ui/repeating-card-stack";
import { Item } from "@/components/ui/repeating-card-stack/types";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import RepeatingCardStack from "../components/ui/repeating-card-stack";

const { width } = Dimensions.get("screen");
const CARD_WIDTH = width * 0.45;
const OPP_CARD_WIDTH = width * 0.25;
const OPP_GAP = 3;
const CARD_GAP = 5;

const data: Item[] = [
  { id: "1", title: "Card 1", color: "#ffadad" },
  // { id: "2", title: "Card 2", color: "#ffd6a5" },
  // { id: "3", title: "Card 3", color: "#fdffb6" },
];

const handData: Item[] = [
  { id: "6", title: "Card 6", color: "#8b2525ff" },
  { id: "7", title: "Card 7", color: "#e7942eff" },
  { id: "8", title: "Card 8", color: "#0ec98aff" },
  { id: "9", title: "Card 6", color: "#8b2525ff" },
  { id: "10", title: "Card 7", color: "#e7942eff" },
  { id: "11", title: "Card 8", color: "#0ec98aff" },
];

import { Button } from "@/components/ui/button";
import SelfHand from "@/components/ui/hand-flatlist";
import OpponentHand from "@/components/ui/opponent-hand";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PlayerView() {
  console.log(Constants.systemFonts);

  const [cards, setCards] = useState(data);
  const [hand, setHand] = useState(handData);

  const scrollX = useSharedValue<number>(0);
  const oppScrollX = useSharedValue<number>(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x / (CARD_WIDTH + CARD_GAP);
  });
  const oppOnScroll = useAnimatedScrollHandler((e) => {
    oppScrollX.value = e.contentOffset.x / (OPP_CARD_WIDTH + OPP_GAP);
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
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={{ flex: 1, width: "100%" }}>
          <OpponentHand
            hand={hand}
            removeById={removeById}
            scrollX={oppScrollX}
            onScroll={oppOnScroll}
            card_width={OPP_CARD_WIDTH}
            gap={OPP_GAP}
          />
        </View>
        <Button title="test" variant={"secondary"} />

        <View style={{ flex: 2, width: "100%", justifyContent: "center" }}>
          <RepeatingCardStack data={cards} cardHeight={300} />
        </View>

        <View
          style={{
            flex: 2,
            width: "100%",
            overflow: "visible",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SelfHand
            gap={CARD_GAP}
            hand={hand}
            removeById={removeById}
            scrollX={scrollX}
            onScroll={onScroll}
            card_width={CARD_WIDTH}
          />
        </View>
      </SafeAreaView>
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
