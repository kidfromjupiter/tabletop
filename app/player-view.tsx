import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  ToastAndroid,
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
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/constants/supabase";
import { useGameStore } from "@/lib/state";
import { SupabaseClient } from "@supabase/supabase-js";
import { router, useNavigation } from "expo-router";

const { width } = Dimensions.get("screen");
const CARD_WIDTH = width * 0.45;
const OPP_CARD_WIDTH = width * 0.25;
const OPP_GAP = 3;
const CARD_GAP = 5;

export default function PlayerView() {
  const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const navigation = useNavigation();

  // Zustand store hooks
  const cards = useGameStore((state) => state.cards);
  const hand = useGameStore((state) => state.hand);
  const addCard = useGameStore((state) => state.addCard);
  const removeCardFromHand = useGameStore((state) => state.removeCardFromHand);
  const roomCode = useGameStore((state) => state.settings.roomCode);

  // nav guard + modal state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const me = useGameStore((state) => state.me);
  const roundId = useGameStore((state) => state.round?.roundId);
  const pendingActionRef = useRef<any>(null);
  const blockNavRef = useRef(true); // while true, back is intercepted
  const players = useGameStore((state) => state.players || []);
  const submissions = useGameStore((state) => state.round?.submissions || []);
  const [roundNumber, setRoundNumber] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const judgeId = useGameStore((state) => state.round?.judgeId);

  useEffect(() => {
    // Intercept only "back" navigations
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      if (e.data.action.type !== "GO_BACK") return; // Allow non-back navigations
      if (!blockNavRef.current) return; // already allowed
      e.preventDefault(); // stop the default behavior
      pendingActionRef.current = e.data.action; // remember what they tried to do
      setConfirmVisible(true);
    });

    (async () => {
      const { count } = await supabase
        .from("rounds")
        .select("*", { head: true, count: "exact" })
        .eq("room_code", roomCode);
      setRoundNumber(count || 1);
    })();
    return unsub;
  }, []);

  const removeById = async (id: string) => {
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
      ToastAndroid.showWithGravity(
        "Already submitted a card for this round!",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
    }
    if (!error) {
      const item = hand.find((item) => item.id === id);
      if (item) addCard(item);
      removeCardFromHand(id);
      setSubmitted(true);
      return true;
    } else {
      return false;
    }
  };

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
          <View pointerEvents="box-none" style={[hudStyles.wrap]}>
            {/* Row 1: round / turn / submissions */}
            <View style={hudStyles.row}>
              <View style={hudStyles.pill}>
                <Text style={hudStyles.pillText}>Round {roundNumber}</Text>
              </View>

              <Button
                title={submitted ? "Go to Reveal" : "Pick & Play Your Card"}
                onPress={() => {
                  if (submitted) {
                    // Navigate to results
                    router.replace("/reveal-sequence");
                  }
                }}
                fullWidth={false}
                disabled={!submitted}
                size="sm"
                variant={submitted ? "primary" : "secondary"}
              />
              {/* <View style={[hudStyles.pill, { paddingHorizontal: 14 }]}>
                <Text style={hudStyles.pillText}>
                  {submitted ? "You're the Card Czar 👑" : "Pick & play your card"}
                </Text>
              </View> */}

              <View style={hudStyles.pill}>
                <Text style={hudStyles.pillText}>
                  {submissions.length}/{players.length - 1} submitted
                </Text>
              </View>
            </View>

            {/* Progress bar under the chips */}
            <Progress
              value={(submissions.length / (players.length - 1)) * 100}
              indicatorClassName="bg-purple-400"
            />

            {/* Row 2: avatars */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={hudStyles.avatars}
            >
              {players.map((p) => (
                <View key={p.id} style={hudStyles.avatarWrap}>
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
                      p.id === judgeId ? hudStyles.ringCzar : null,
                    ]}
                  >
                    <View style={hudStyles.avatarFallback}>
                      {/* <Text style={hudStyles.avatarFallbackText}>{p.name}</Text> */}
                    </View>
                  </View>
                  <Text numberOfLines={1} style={hudStyles.avatarName}>
                    {p.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
          <StatusBar style="light" />

          <View style={{ flex: 1, width: "100%" }}>
            {/* Opponent hand (optional) */}
          </View>

          <View style={{ flex: 2, width: "100%", justifyContent: "center" }}>
            <RepeatingCardStack data={cards} cardHeight={300} />
          </View>

          <View
            style={{
              flex: 2,
              width: "100%",
              overflow: "visible",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <SelfHand
              gap={CARD_GAP}
              hand={hand}
              removeById={removeById} // Directly pass the function
              card_width={CARD_WIDTH}
            />
          </View>

          <ConfirmModal
            visible={confirmVisible}
            onCancel={() => setConfirmVisible(false)}
            onConfirm={() => {
              blockNavRef.current = false;
              if (pendingActionRef.current) {
                navigation.dispatch(pendingActionRef.current);
              } else {
                router.replace("/welcome");
              }
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
