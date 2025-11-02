import React from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";

type Props = {
  // Keep RN-style props cross-platform
  source: any; // require("./anim.json") or JSON object
  autoPlay?: boolean;
  loop?: boolean | number;
  style?: StyleProp<ViewStyle> | any; // allow CSSProperties on web
  speed?: number;
  onAnimationFinish?: (isCancelled: boolean) => void;
  // web-only niceties (ignored on native)
  className?: string;
  lottieRef?: React.Ref<any>;
} & Record<string, any>;

// We build two tiny implementations without importing the wrong lib on the wrong platform.
function WebImpl({
  source,
  autoPlay,
  loop,
  style,
  speed = 1,
  onAnimationFinish,
  className,
  lottieRef,
  ...rest
}: Props) {
  const Lottie = require("lottie-react").default as any;
  const animationData =
    (source && (source.default ?? source.animationData ?? source)) || source;

  return (
    <Lottie
      animationData={animationData}
      autoplay={autoPlay}
      loop={!!loop}
      style={style}
      onComplete={() => onAnimationFinish?.(false)}
      speed={speed}
      lottieRef={lottieRef as any}
      className={className}
      {...rest}
    />
  );
}

function NativeImpl(props: Props) {
  const LottieViewNative = require("lottie-react-native").default as any;
  // Pass-through: lottie-react-native already uses RN-style props
  return <LottieViewNative {...props} />;
}

export default function LottieView(props: Props) {
  return Platform.OS === "web" ? (
    <WebImpl {...props} />
  ) : (
    <NativeImpl {...props} />
  );
}
