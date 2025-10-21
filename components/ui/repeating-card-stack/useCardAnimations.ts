import { useAnimatedStyle } from "react-native-reanimated";
import { StackCardProps } from "./types";

export function useCardAnimations(props: StackCardProps) {
  const {
    i,
    VISIBLE,
    GAP_Y,
    SCALE_STEP,
    head,
    tx,
    ty,
    rot,
    reorder,
    reenter,
    reenterIndex,
    intro,
    introIndex,
    layerOf,
    depthRot,
  } = props;

  return useAnimatedStyle(() => {
    const layer = layerOf(i);
    if (layer >= VISIBLE)
      return { opacity: 0, zIndex: -1, transform: [{ scale: 0.9 }] };

    const isTop = layer === 0;
    const baseTy = layer * GAP_Y;
    const baseScale = 1 - layer * SCALE_STEP;
    const curDepthRot = depthRot(layer);
    const nextDepthRot = depthRot(layer - 1);
    const rotDeg = isTop
      ? rot.value
      : curDepthRot + (nextDepthRot - curDepthRot) * reorder.value;

    const isReentering = reenterIndex.value === i && layer === VISIBLE - 1;
    const pEntry = isReentering ? reenter.value : 1;
    const fromTy = (layer + 1) * GAP_Y;
    const fromScale = 1 - (layer + 1) * SCALE_STEP;
    const fromRot = depthRot(layer + 1);
    const fromOpacity = 0.0;
    const entryTy = fromTy + (baseTy - fromTy) * pEntry;
    const entryScale = fromScale + (baseScale - fromScale) * pEntry;
    const entryRot = fromRot + (curDepthRot - fromRot) * pEntry;
    const entryOpacity = fromOpacity + (1 - fromOpacity) * pEntry;

    const isIntroTop = introIndex.value === i && layer === 0;
    const pIntro = isIntroTop ? intro.value : 1;
    // More dramatic fly-in: start lower and slightly from the side with a gentle rotation
    const introFromTy = Math.max(200, GAP_Y * 8);
    const introFromScale = 0.9;
    const introFromOpacity = 0.0;
    const introFromRot = 8; // slight tilt
    const introFromX = 48; // slide in from the side
    const introTy = introFromTy + (0 - introFromTy) * pIntro;
    const introScale = introFromScale + (1 - introFromScale) * pIntro;
    const introOpacity = introFromOpacity + (1 - introFromOpacity) * pIntro;
    const introRot = introFromRot + (0 - introFromRot) * pIntro;
    const introX = introFromX + (0 - introFromX) * pIntro;

    const promoShiftY = layer > 0 ? -reorder.value * GAP_Y : 0;
    const promoScale = layer > 0 ? reorder.value * SCALE_STEP : 0;

    return {
      zIndex: VISIBLE - layer,
      opacity: isIntroTop ? introOpacity : isReentering ? entryOpacity : 1,
      transform: [
        { translateX: isTop ? (isIntroTop ? introX : 0) + tx.value : 0 },
        {
          translateY:
            (isTop ? ty.value : 0) +
            (isIntroTop ? introTy : isReentering ? entryTy : baseTy) +
            promoShiftY,
        },
        {
          rotateZ: `${
            isIntroTop ? introRot : isReentering ? entryRot : rotDeg
          }deg`,
        },
        {
          scale:
            (isIntroTop ? introScale : isReentering ? entryScale : baseScale) +
            promoScale,
        },
      ],
    };
  });
}
