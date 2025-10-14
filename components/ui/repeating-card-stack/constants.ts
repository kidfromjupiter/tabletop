import { Dimensions } from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export const SCREEN = { SCREEN_W, SCREEN_H };

export const VISIBLE = 3;
export const GAP_Y = 14;
export const SCALE_STEP = 0.06;
export const ROT_DEG = 2;
export const SWIPE_X = SCREEN_W * 0.28;
export const FLY_DURATION = 220;

export const SNAP_SPRING = {
  damping: 22,
  stiffness: 380,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 2,
};
