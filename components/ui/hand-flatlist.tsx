import { Dimensions } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedRef,
  useScrollOffset,
} from "react-native-reanimated";
import { Item } from "./repeating-card-stack/types";
import { ScrollableCard } from "./scrollable-card";

const { width } = Dimensions.get("screen");

export default function SelfHand({
  hand,
  removeById,
  card_width,
  gap = 5,
}: {
  hand: Item[];
  removeById: (id: string) => Promise<boolean>;
  card_width: number;
  gap?: number;
}) {
  const totalWidth = card_width + gap;
  const animatedRef = useAnimatedRef<FlatList>();
  const scrollOffset = useScrollOffset(animatedRef);

  return (
    <FlatList
      data={hand}
      contentContainerStyle={{
        paddingHorizontal: (width - card_width) / 2,
        gap: gap,
        alignItems: "center",
        paddingTop: 25,
      }}
      ref={animatedRef}
      snapToInterval={card_width + gap}
      horizontal
      decelerationRate={"fast"}
      keyExtractor={(item) => item.id}
      // Animate item reflow on insert/remove/reorder
      // itemLayoutAnimation={LinearTransition.springify()
      //   .damping(15)
      //   .stiffness(450)
      //   .mass(0.6)}
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
            rotation={35}
            yRange={20}
            scrollX={scrollOffset}
            index={index}
            id={item.id}
            totalWidth={totalWidth}
            callback={removeById}
          />
        </Animated.View>
      )}
      showsHorizontalScrollIndicator={false}
      removeClippedSubviews={true}
      windowSize={1}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 10,
      }}
      scrollEventThrottle={16}
    />
  );
}
