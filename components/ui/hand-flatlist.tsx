import { Dimensions } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  SharedValue,
} from "react-native-reanimated";
import { Item } from "./repeating-card-stack/types";
import { ScrollableCard } from "./scrollable-card";

const { width } = Dimensions.get("screen");

export default function SelfHand({
  hand,
  removeById,
  scrollX,
  onScroll,
  card_width,
  gap = 5,
}: {
  hand: Item[];
  removeById: (id: string) => void;
  scrollX: SharedValue<number>;
  onScroll: (e: any) => void;
  card_width: number;
  gap?: number;
}) {
  return (
    <Animated.FlatList
      data={hand}
      contentContainerStyle={{
        paddingHorizontal: (width - card_width) / 2,
        gap: gap,
        alignItems: "center",
        paddingTop: 25,
      }}
      snapToInterval={card_width + gap}
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
          style={{ width: card_width }}
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
  );
}
