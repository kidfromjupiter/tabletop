import React, { useEffect, useMemo, useRef } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Tunables
const VISIBLE = 3; // how many stacked cards are visible
const GAP_Y = 14; // vertical offset between stacked cards
const SCALE_STEP = 0.06; // scale reduction per layer
const ROT_DEG = 2; // subtle rotation for depth layers
const SWIPE_X = SCREEN_W * 0.28; // horizontal threshold to dismiss
const FLY_DURATION = 220; // ms
const SNAP_SPRING = {
  damping: 22,
  stiffness: 380,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 2,
};

export type Item = {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
};

type Props = {
  data: Item[]; // immutable array; we recycle by index math (no setState churn)
  cardHeight?: number; // optional fixed height
};

export default function RepeatingCardStack({
  data,
  cardHeight = SCREEN_H * 0.6,
}: Props) {
  const N = data.length;

  // Shared deck state
  const head = useSharedValue(0); // index of the top card (absolute index in data)
  const tx = useSharedValue(0); // top card translationX
  const ty = useSharedValue(0); // top card translationY
  const rot = useSharedValue(0); // little tilt while dragging

  const reorder = useSharedValue(0); // 0..1 during top fly-out to promote depth
  const reenter = useSharedValue(0); // 0..1 during tail re-entry of dismissed card
  const reenterIndex = useSharedValue(-1); // absolute index of the recycled card

  // Intro animation for freshly added top card
  const intro = useSharedValue(0); // 0..1 progress
  const introIndex = useSharedValue(-1); // absolute index that’s intro’ing

  // Keep a shared value copy of N to avoid stale closures in worklets
  const NRef = useSharedValue(N);
  useEffect(() => {
    NRef.value = N;
  }, [N]);

  const items = useMemo(() => data, [data]);

  // Helper: absolute item index -> relative layer (0 = top)
  const layerOf = (i: number) => {
    "worklet";
    const n = NRef.value || 1;
    const rel = (i - head.value + n) % n;
    return rel; // 0..n-1
  };

  // Depth-dependent rotation
  const depthRot = (l: number) => {
    "worklet";
    if (l <= 0) return 0;
    return l % 2 === 0 ? ROT_DEG : -ROT_DEG;
  };

  // Detect new item appended -> make it top + play intro
  const prevCountRef = useRef(N);
  useEffect(() => {
    const prev = prevCountRef.current;
    if (N > prev && N > 0) {
      const newIdx = N - 1; // appended at the end
      head.value = newIdx; // make it top
      introIndex.value = newIdx;

      // reset interactive values so user sees a clean intro
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  return (
    <View style={[styles.root, { height: cardHeight }]}>
      {items.map((item, i) => (
        <StackCard
          key={item.id}
          item={item}
          i={i}
          cardHeight={cardHeight}
          // pass shared values / helpers
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

type StackCardProps = {
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

  layerOf: (i: number) => number; // worklet-safe helper
  depthRot: (l: number) => number; // worklet-safe helper
};

const StackCard = React.memo((props: StackCardProps) => {
  const {
    item,
    i,
    cardHeight,
    NRef,
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

  // Per-card gesture instance (never reused -> no handlerTag mutation)
  const pan = React.useMemo(() => {
    return Gesture.Pan()
      .onChange((e) => {
        "worklet";
        // Only let the TOP card react
        if (layerOf(i) !== 0) return;
        tx.value += e.changeX;
        ty.value += e.changeY;
        rot.value = interpolate(tx.value, [-SCREEN_W, 0, SCREEN_W], [8, 0, -8]);
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
        const toX = dir * SCREEN_W * 1.2;

        // Promote depth while top flies out
        reorder.value = 0;
        reorder.value = withTiming(1, {
          duration: FLY_DURATION,
          easing: Easing.out(Easing.cubic),
        });

        // Use withTiming for fly-out (withSpring doesn't take duration)
        tx.value = withTiming(
          toX,
          { duration: FLY_DURATION, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (!finished) return;

            const Ncur = NRef.value || 1;
            const prevHead = head.value;
            head.value = (head.value + 1) % Ncur;

            // Reset gesture state so the new top starts clean
            tx.value = 0;
            ty.value = 0;
            rot.value = 0;
            reorder.value = 0;

            // kick tail re-entry for the dismissed card
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable instance; reads live state via shared values

  // Animated style for this card
  const style = useAnimatedStyle(() => {
    const layer = layerOf(i); // 0 = top

    if (layer >= VISIBLE) {
      return { opacity: 0, zIndex: -1, transform: [{ scale: 0.9 }] };
    }

    const isTop = layer === 0;

    // Base (pre-promotion) depth transforms
    const baseTy = layer * GAP_Y;
    const baseScale = 1 - layer * SCALE_STEP;

    // rotation blending logic for depth
    const curDepthRot = depthRot(layer);
    const nextDepthRot = depthRot(layer - 1);
    const rotDeg = isTop
      ? rot.value
      : curDepthRot + (nextDepthRot - curDepthRot) * reorder.value;

    // ----- tail re-entry for dismissed card -----
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

    // ----- fresh-top intro for newly added card -----
    const isIntroTop = introIndex.value === i && layer === 0;
    const pIntro = isIntroTop ? intro.value : 1;
    const introFromTy = -Math.max(40, GAP_Y * 2);
    const introFromScale = 0.92;
    const introFromOpacity = 0.0;
    const introFromRot = -6;
    const introTy = introFromTy + (0 - introFromTy) * pIntro;
    const introScale = introFromScale + (1 - introFromScale) * pIntro;
    const introOpacity = introFromOpacity + (1 - introFromOpacity) * pIntro;
    const introRot = introFromRot + (0 - introFromRot) * pIntro;

    // promotion shift/scale while top flies out
    const promoShiftY = layer > 0 ? -reorder.value * GAP_Y : 0;
    const promoScale = layer > 0 ? reorder.value * SCALE_STEP : 0;

    return {
      zIndex: VISIBLE - layer,
      opacity: isIntroTop ? introOpacity : isReentering ? entryOpacity : 1,
      transform: [
        { translateX: isTop ? tx.value : 0 },
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

  return (
    <Animated.View
      style={[
        styles.card,
        style,
        { height: cardHeight, backgroundColor: item.color || "#222" },
      ]}
    >
      <GestureDetector gesture={pan}>
        <View style={styles.cardInner}>
          <Text style={styles.title}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          ) : null}
        </View>
      </GestureDetector>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    position: "absolute",
    width: "88%",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardInner: { flex: 1, justifyContent: "center" },
  title: { color: "white", fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: "rgba(255,255,255,0.9)" },
});
