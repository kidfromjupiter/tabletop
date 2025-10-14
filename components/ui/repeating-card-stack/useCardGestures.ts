import { Gesture } from "react-native-gesture-handler";
import {
  Easing,
  interpolate,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { FLY_DURATION, SCREEN, SNAP_SPRING, SWIPE_X } from "./constants";

export function useCardGestures(
  i: number,
  layerOf: (i: number) => number,
  NRef: any,
  head: any,
  tx: any,
  ty: any,
  rot: any,
  reorder: any,
  reenter: any,
  reenterIndex: any
) {
  const pan = Gesture.Pan()
    .onChange((e) => {
      "worklet";
      if (layerOf(i) !== 0) return;
      tx.value += e.changeX;
      ty.value += e.changeY;
      rot.value = interpolate(
        tx.value,
        [-SCREEN.SCREEN_W, 0, SCREEN.SCREEN_W],
        [8, 0, -8]
      );
    })
    .onEnd((e) => {
      "worklet";
      if (layerOf(i) !== 0) return;

      const vx = Math.abs(e.velocityX);
      const shouldDismiss = Math.abs(tx.value) > SWIPE_X || vx > 800;

      if (!shouldDismiss) {
        tx.value = withSpring(0, SNAP_SPRING);
        ty.value = withSpring(0, SNAP_SPRING);
        rot.value = withSpring(0, SNAP_SPRING);
        return;
      }

      const dir = Math.sign(tx.value || e.velocityX || 1);
      const toX = dir * SCREEN.SCREEN_W * 1.2;

      reorder.value = 0;
      reorder.value = withTiming(1, {
        duration: FLY_DURATION,
        easing: Easing.out(Easing.cubic),
      });

      tx.value = withTiming(
        toX,
        { duration: FLY_DURATION, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (!finished) return;
          const Ncur = NRef.value || 1;
          const prevHead = head.value;
          head.value = (head.value + 1) % Ncur;

          tx.value = 0;
          ty.value = 0;
          rot.value = 0;
          reorder.value = 0;

          reenterIndex.value = prevHead;
          reenter.value = 0;
          reenter.value = withTiming(
            1,
            { duration: 180, easing: Easing.out(Easing.cubic) },
            () => {
              reenterIndex.value = -1;
              reenter.value = 0;
            }
          );
        }
      );
    });

  return pan;
}
