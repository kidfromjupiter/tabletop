import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import SelfHand from "@/components/ui/hand-flatlist";
import ConfirmModal from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import RepeatingCardStack from "@/components/ui/repeating-card-stack";
import { ScrollableCard } from "@/components/ui/scrollable-card";
import { StoreState, useGameStore } from "@/lib/state";
import supabase from "@/lib/supabase";
import { showToast } from "@/lib/toast";
import { useSoundEffects } from "@/providers/sfx-provider";
import { FontAwesome6 } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeOut,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("screen");
const CARD_WIDTH = width * 0.45;
const CARD_GAP = 5;

export default function PlayerView() {
  const navigation = useNavigation();

  // Zustand store hooks
  const cards = useGameStore((state) => state.submittedCardStack);
  const hand = useGameStore((state) => state.hand);
  const addCard = useGameStore((state) => state.addCard);
  const removeCardFromHand = useGameStore((state) => state.removeCardFromHand);
  const addCardToHand = useGameStore((state) => state.addCardToHand);
  const removeCardFromSubmittedStack = useGameStore(
    (state) => state.removeCardFromSubmittedStack
  );
  const roomCode = useGameStore((state) => state.settings.roomCode);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const me = useGameStore((state) => state.me);
  const roundId = useGameStore((state) => state.round?.roundId);
  const pendingActionRef = useRef<any>(null);
  const blockNavRef = useRef(true); // while true, back is intercepted
  const players = useGameStore((state) => state.players || []);
  const submissions = useGameStore((state) => state.round?.submissions || []);
  const [roundNumber, setRoundNumber] = useState(1);
  const [submitted, setSubmitted] = useState(
    submissions.some((s) => s.playerId === me?.id)
  );
  const judgeId = useGameStore((state) => state.round?.judgeId);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const soundFxPlayer = useSoundEffects();
  const [updatedSubmissionUserId, setUpdatedSubmissionUserId] = useState("");
  useEffect(() => {
    // scale animation when submissions change
    scale.value = withTiming(1.1, { duration: 300 }, () => {
      scale.value = withSpring(1);
    });
    ty.value = withTiming(-4, { duration: 300 }, () => {
      ty.value = withSpring(0);
    });
    console.log("running submission animation");
    // highlight bg briefly
  }, [updatedSubmissionUserId]);

  useEffect(() => {
    wobble();
  }, [submitted]);

  const rot = useSharedValue(0);
  useEffect(() => {
    let isMounted = true;

    const loop = () => {
      if (!isMounted || !submitted) return;
      // kick off wobble now
      wobble();
      // schedule next wobble in ~2 seconds using JS
      timer = setTimeout(loop, 2000);
    };

    let timer = setTimeout(loop, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cancelAnimation(rot);
    };
  }, [rot, submitted]);

  // one wobble cycle
  const wobble = () => {
    // sequence explanation:
    //  - tilt right
    //  - tilt left
    //  - smaller right
    //  - settle at 0 with spring
    rot.value = withSequence(
      withTiming(3, {
        duration: 100,
      }),
      withRepeat(
        withTiming(-3, {
          duration: 100,
        }),
        3,
        true
      ),
      withSpring(0, {
        damping: 10,
        stiffness: 200,
        mass: 0.4,
      })
    );
  };

  useEffect(() => {
    // Intercept only "back" navigations
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      if (e.data.action.type !== "GO_BACK") return; // Allow non-back navigations
      e.preventDefault(); // stop the default behavior
      setConfirmVisible(true);
    });

    (async () => {
      const { count } = await supabase
        .from("rounds")
        .select("*", { head: true, count: "exact" })
        .eq("room_code", roomCode);
      setRoundNumber(count || 1);
    })();
    const zustandListener = useGameStore.subscribe(
      (currState: StoreState, prevState: StoreState) => {
        if (!prevState.round || !currState.round) return;
        if (
          currState.round?.submissions.length >
            prevState.round?.submissions.length &&
          currState.round?.submissions.length > 0
        ) {
          const latest =
            currState.round.submissions[currState.round.submissions.length - 1];
          setUpdatedSubmissionUserId(latest.playerId || "");
        }
      }
    );
    return () => {
      unsub();
      zustandListener();
    };
  }, []);

  const removeById = async (id: string) => {
    const item = hand.find((item) => item.id === id);
    if (item) addCard(item);
    removeCardFromHand(id);
    const { data, error, response } = await supabase.functions.invoke(
      "endpoints",
      {
        body: {
          action: "submit_cards",
          payload: {
            round_id: roundId,
            user_id: me?.id,
            answer_card_ids: [id],
          },
        },
      }
    );
    if (response?.status === 405) {
      showToast("Already submitted a card for this round.");
    }
    if (!error) {
      setSubmitted(true);
      return true;
    } else {
      if (item) addCardToHand(item); // re-add card on error
      if (item) removeCardFromSubmittedStack(id);

      return false;
    }
  };
  const animatedAvatarStyle = useAnimatedStyle(() => {
    return {
      transformOrigin: "bottom",
      transform: [{ scale: scale.value }, { translateY: ty.value }],
    };
  });
  const wobbleAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rot.value}deg` }],
    };
  });
  const playFlip = React.useCallback(
    (name: string) => {
      soundFxPlayer.play("card-flip"); // your own player / expo-av wrapper
    },
    [soundFxPlayer]
  );

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={[styles.container]}>
        <ImageBackground
          style={{
            flex: 1,
            width: "100%",
            padding: 0,
          }}
          source={require("../assets/images/bg.jpg")}
          imageStyle={{
            opacity: 0.7,
            resizeMode: "cover",
          }}
        >
          <View style={[hudStyles.wrap]}>
            {/* Row 1: round / turn / submissions */}
            <View style={hudStyles.row}>
              <View style={hudStyles.pill}>
                <Text style={hudStyles.pillText}>Round {roundNumber}</Text>
              </View>

              {submitted ? (
                <Animated.View
                  style={wobbleAnimStyle}
                  entering={FadeIn}
                  exiting={FadeOut}
                >
                  <Button
                    title={"Go to Reveal"}
                    onPress={() => {
                      if (submitted) {
                        // Navigate to results
                        router.navigate("/reveal-sequence");
                      }
                    }}
                    fullWidth={false}
                    disabled={!submitted}
                    size="sm"
                    variant={submitted ? "primary" : "secondary"}
                  />
                </Animated.View>
              ) : (
                <Animated.View
                  style={[hudStyles.pill]}
                  entering={FadeIn}
                  exiting={FadeOut}
                >
                  <Text style={hudStyles.pillText}>
                    {submissions.length}/{players.length - 1} submitted
                  </Text>
                </Animated.View>
              )}
            </View>

            {/* Progress bar under the chips */}
            <Progress
              value={(submissions.length / (players.length - 1)) * 100}
              indicatorClassName="bg-purple-400"
            />

            {/* Row 2: avatars */}
            <ScrollView
              horizontal
              style={{ overflow: "visible" }}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[hudStyles.avatars]}
            >
              {players.map((p) => (
                <Animated.View
                  key={p.id}
                  style={[
                    hudStyles.avatarWrap,
                    p.id === updatedSubmissionUserId
                      ? animatedAvatarStyle
                      : null,
                  ]}
                >
                  <View
                    style={[
                      hudStyles.avatarRing,
                      hudStyles.ringPending,
                      //hudStyles.ringSubmitted,
                      submissions.some((s) => s.playerId === p.id)
                        ? hudStyles.ringSubmitted
                        : null,
                      // p.submitted ? hudStyles.ringSubmitted : hudStyles.ringPending,
                      // p.isCzar ? hudStyles.ringCzar : null,
                      //p.id === judgeId ? hudStyles.ringCzar : null,
                    ]}
                  >
                    <View style={hudStyles.avatarFallback}>
                      {p.id === judgeId ? (
                        <FontAwesome6 name="crown" size={16} color="white" />
                      ) : (
                        <Text>🙂</Text>
                      )}
                      {/* <Text>{p.</Text> */}
                      {/* <Text style={hudStyles.avatarFallbackText}>{p.name}</Text> */}
                    </View>
                  </View>
                  <Text numberOfLines={1} style={hudStyles.avatarName}>
                    {p.name}
                  </Text>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          <View style={{ flex: 1, width: "100%" }} pointerEvents="none">
            {/* Opponent hand (optional) */}
          </View>

          <Animated.View
            style={[
              {
                flex: 2,
                width: "100%",
                justifyContent: "center",
              },
            ]}
            entering={
              Platform.OS !== "web"
                ? new Keyframe({
                    0: {
                      opacity: 0,
                      transform: [
                        { translateY: 80 },
                        { rotate: "-60deg" },
                        { scale: 2 },
                      ],
                    },
                    60: {
                      opacity: 1,
                      transform: [
                        { translateY: -10 },
                        { rotate: "5deg" },
                        { scale: 1.05 },
                      ],
                    },
                    100: {
                      opacity: 1,
                      transform: [
                        { translateY: 0 },
                        { rotate: "0deg" },
                        { scale: 1 },
                      ],
                    },
                  })
                : undefined
            }
          >
            <RepeatingCardStack data={cards} cardHeight={300} />
          </Animated.View>

          {Platform.OS == "web" ? (
            <ScrollView
              horizontal
              style={{ width: "100%", flex: 2 }}
              contentContainerStyle={{
                gap: CARD_GAP,
                overflow: "visible",
              }}
              showsHorizontalScrollIndicator={false}
            >
              {hand.map((item, index) => (
                <ScrollableCard
                  data={item}
                  style={{
                    width: "100%",
                    overflow: "visible",
                  }}
                  rotation={35}
                  yRange={20}
                  index={index}
                  id={item.id}
                  totalWidth={CARD_WIDTH + CARD_GAP}
                  callback={removeById}
                />
              ))}
            </ScrollView>
          ) : (
            <View
              style={{
                flex: 2,
                width: "100%",
                overflow: "visible",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Animated.View>
                <SelfHand
                  gap={CARD_GAP}
                  hand={hand}
                  removeById={removeById} // Directly pass the function
                  card_width={CARD_WIDTH}
                />
              </Animated.View>
            </View>
          )}

          <ConfirmModal
            visible={confirmVisible}
            onCancel={() => setConfirmVisible(false)}
            onConfirm={() => {
              router.dismissTo("/welcome");
            }}
          />
        </ImageBackground>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000ff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    //justifyContent: "space-between",
  },
  card: {
    height: 200,
    aspectRatio: 3 / 4,
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderColor: "#dbdbdbff",
    borderWidth: 1,
  },
});
const hudStyles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  progressTrack: {
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
  },
  avatars: { paddingVertical: 6, gap: 12, alignItems: "center" },
  avatarWrap: { width: 54, alignItems: "center" },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  ringSubmitted: { borderColor: "#6A5AE0" }, // green ring
  ringPending: { borderColor: "rgba(255,255,255,0.35)" },
  ringCzar: { borderColor: "#ffd54a" }, // gold ring if czar
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatarFallbackText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  avatarName: {
    marginTop: 4,
    fontSize: 10,
    color: "#fff",
    opacity: 0.9,
    maxWidth: 54,
    textAlign: "center",
  },
});
