import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ImageBackground, Text, View } from "react-native";
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
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255, 255, 255, 0.15)", "rgba(255,255,255,0)"]}
        start={{ x: 0.5, y: 0 }} // top-center
        end={{ x: 0.5, y: 1 }} // fade downward
        style={styles.topHighlight}
      />
      <ImageBackground
        style={{ flex: 1, width: "100%" }}
        source={
          props.item.backside
            ? require("../../../assets/images/card_bg_5.jpg")
            : null
        }
        imageStyle={{
          opacity: 1,
        }}
      >
        <GestureDetector gesture={pan}>
          <View
            style={[
              styles.cardInner,
              {
                justifyContent: props.item.prompt ? "flex-start" : "center",
                alignItems: props.item.prompt ? "flex-start" : "center",
              },
            ]}
          >
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={[
                styles.title,
                { color: props.item.prompt ? "#fff" : "#000" },
              ]}
            >
              {props.item.text}
            </Text>
          </View>
        </GestureDetector>
      </ImageBackground>
    </Animated.View>
  );
});
