import React from "react";
import { Dimensions } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeOut,
  Keyframe,
  LinearTransition,
  useAnimatedRef,
  useScrollOffset,
} from "react-native-reanimated";
import { Item } from "./repeating-card-stack/types";
import { ScrollableCard } from "./scrollable-card";

const { width } = Dimensions.get("screen");
const STAGGER_MS = 100; // gap between items
const DURATION_MS = 280; // how fast each item flies up
const LIFT_PX = 14;
// Start edge-on (half flipped), pop to 1.2x, then finish facing front at 1.0x.
//.easing(Easing.out(Easing.cubic));
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
      renderItem={({ item, index }) => {
        const FlipFlyUp = new Keyframe({
          0: {
            opacity: 0,
            transform: [
              { perspective: 800 },
              { translateY: LIFT_PX },
              { rotateY: "90deg" }, // start half-flipped; use "90deg" to flip the other direction
              { scale: 1.1 },
            ],
          },
          60: {
            opacity: 0.8,
            transform: [
              { perspective: 800 },
              { translateY: Math.round(LIFT_PX / 3) },
              { rotateY: "10deg" }, // finishing the flip
              { scale: 1.05 }, // still “popped”
            ],
            easing: Easing.cubic,
          },
          100: {
            opacity: 1,
            transform: [
              { perspective: 800 },
              { translateY: 0 },
              { rotateY: "0deg" },
              { scale: 1 },
            ],
          },
        }).duration(DURATION_MS);
        return (
          <Animated.View
            // This layout prop lets siblings reflow smoothly when items are removed.
            layout={LinearTransition.springify()
              .damping(12)
              .stiffness(500)
              .mass(0.4)}
            style={{ width: card_width }}
            entering={FlipFlyUp.delay(index * STAGGER_MS)}
            // entering={FadeInUp.duration(DURATION_MS)
            //   .delay(index * STAGGER_MS)
            //   .withInitialValues({
            //     transform: [{ translateY: LIFT_PX }],
            //     opacity: 0,
            //   })}
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
        );
      }}
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
