import { SharedValue } from "react-native-reanimated";

export type Item = {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
};

export type StackCardProps = {
  item: Item;
  i: number;
  cardHeight: number;
  NRef: SharedValue<number>;
  VISIBLE: number;
  GAP_Y: number;
  SCALE_STEP: number;
  head: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  rot: SharedValue<number>;
  reorder: SharedValue<number>;
  reenter: SharedValue<number>;
  reenterIndex: SharedValue<number>;
  intro: SharedValue<number>;
  introIndex: SharedValue<number>;
  layerOf: (i: number) => number;
  depthRot: (l: number) => number;
};
