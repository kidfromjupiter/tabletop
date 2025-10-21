import React from "react";
import { Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { styles } from "./styles";
import { StackCardProps } from "./types";
import { useCardAnimations } from "./useCardAnimations";
import { useCardGestures } from "./useCardGestures";

export const StackCard = React.memo((props: StackCardProps) => {
  const pan = useCardGestures(
    props.i,
    props.layerOf,
    props.NRef,
    props.head,
    props.tx,
    props.ty,
    props.rot,
    props.reorder,
    props.reenter,
    props.reenterIndex
  );
  const style = useCardAnimations(props);

  return (
    <Animated.View
      style={[
        styles.card,
        style,
        {
          height: props.cardHeight,
          backgroundColor: props.item.prompt ? "#222" : "#ffffffff",
        },
      ]}
    >
      <GestureDetector gesture={pan}>
        <View style={styles.cardInner}>
          <Text
            style={[
              styles.title,
              { color: props.item.prompt ? "#fff" : "#000" },
            ]}
          >
            {props.item.text}
          </Text>
        </View>
      </GestureDetector>
    </Animated.View>
  );
});
