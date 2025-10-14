import React, { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { GAP_Y, SCALE_STEP, SCREEN, VISIBLE } from "./constants";
import { StackCard } from "./stack-card";
import { styles } from "./styles";
import { Item } from "./types";

type Props = {
  data: Item[];
  cardHeight?: number;
};

export default function RepeatingCardStack({
  data,
  cardHeight = SCREEN.SCREEN_H * 0.6,
}: Props) {
  const N = data.length;
  const head = useSharedValue(0);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const reorder = useSharedValue(0);
  const reenter = useSharedValue(0);
  const reenterIndex = useSharedValue(-1);
  const intro = useSharedValue(0);
  const introIndex = useSharedValue(-1);

  const NRef = useSharedValue(N);
  useEffect(() => {
    NRef.value = N;
  }, [N]);

  const items = useMemo(() => data, [data]);

  const layerOf = (i: number) => {
    "worklet";
    const n = NRef.value || 1;
    return (i - head.value + n) % n;
  };

  const depthRot = (l: number) => {
    "worklet";
    if (l <= 0) return 0;
    return l % 2 === 0 ? 2 : -2;
  };

  const prevCountRef = useRef(N);
  useEffect(() => {
    const prev = prevCountRef.current;
    if (N > prev && N > 0) {
      const newIdx = N - 1;
      head.value = newIdx;
      introIndex.value = newIdx;
      tx.value = 0;
      ty.value = 0;
      rot.value = 0;
      intro.value = 0;
      intro.value = withTiming(
        1,
        { duration: 240, easing: Easing.out(Easing.cubic) },
        () => {
          introIndex.value = -1;
          intro.value = 0;
        }
      );
    }
    prevCountRef.current = N;
  }, [N]);

  return (
    <View style={[styles.root, { height: cardHeight }]}>
      {items.map((item, i) => (
        <StackCard
          key={item.id}
          item={item}
          i={i}
          cardHeight={cardHeight}
          NRef={NRef}
          VISIBLE={VISIBLE}
          GAP_Y={GAP_Y}
          SCALE_STEP={SCALE_STEP}
          head={head}
          tx={tx}
          ty={ty}
          rot={rot}
          reorder={reorder}
          reenter={reenter}
          reenterIndex={reenterIndex}
          intro={intro}
          introIndex={introIndex}
          layerOf={layerOf}
          depthRot={depthRot}
        />
      ))}
    </View>
  );
}
