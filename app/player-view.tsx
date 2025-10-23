import { Item } from "@/components/ui/repeating-card-stack/types";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  ToastAndroid,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import SelfHand from "@/components/ui/hand-flatlist";
import ConfirmModal from "@/components/ui/modal";
import RepeatingCardStack from "@/components/ui/repeating-card-stack";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/constants/supabase";
import { useGameStore } from "@/lib/state";
import {
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import { router, useNavigation } from "expo-router";

const { width } = Dimensions.get("screen");
const CARD_WIDTH = width * 0.45;
const OPP_CARD_WIDTH = width * 0.25;
const OPP_GAP = 3;
const CARD_GAP = 5;

const data: Item[] = [{ id: "1", text: "Card 1" }];

const handData: Item[] = [
  { id: "6", text: "Card 6" },
  { id: "7", text: "Card 7" },
  { id: "8", text: "Card 8" },
  { id: "9", text: "Card 6" },
  { id: "10", text: "Card 7" },
  { id: "11", text: "Card 8" },
];

export default function PlayerView() {
  const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const navigation = useNavigation();
  const [cards, setCards] = useState(data);
  const [hand, setHand] = useState(handData);
  // const hand = useGameStore((state) => state.hand);

  // nav guard + modal state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const me = useGameStore((state) => state.me);
  const roomCode = useGameStore((state) => state.settings.roomCode);
  const roundId = useGameStore((state) => state.round?.roundId);
  const pendingActionRef = useRef<any>(null);
  const blockNavRef = useRef(true); // while true, back is intercepted

  useEffect(() => {
    // Intercept any attempt to leave this screen
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      if (!blockNavRef.current) return; // already allowed
      e.preventDefault(); // stop the default behavior
      pendingActionRef.current = e.data.action; // remember what they tried to do
      setConfirmVisible(true);
    });
    return unsub;
  }, []);
  useEffect(() => {
    if (!me) return;
    (async () => {
      const { data: roomState } = await supabase.functions.invoke("endpoints", {
        body: {
          action: "room_state",
          payload: {
            room_code: roomCode,
            user_id: me?.id,
          },
        },
      });
      const { data: submissions } = await supabase
        .from("round_submissions")
        .select(
          "profiles(display_name, avatar, id), id, round_submission_items(answer_cards(text))"
        )
        .eq("round_id", roundId);
      const submissionCards = submissions?.map((submission: any) => {
        if (submission.profiles.id == me.id) {
          // TODO: only works for 1 card submissions
          return {
            id: submission.id,
            text: submission.round_submission_items[0].answer_cards.text,
            backside: false,
          };
        }
        return {
          id: submission.id,
          text: submission.profiles.display_name,
          backside: true,
        };
      });
      setHand(roomState.my_hand);
      setCards([
        {
          id: roomState.round.prompt.id,
          text: roomState.round.prompt.text,
          prompt: true,
        },
        ...(submissionCards ? submissionCards : []),
      ]);
    })();
  }, []);

  useEffect(() => {
    const sub = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "round_submissions",
          filter: `round_id=eq.${roundId},user_id=neq.${me?.id}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === "INSERT") {
            const submission_id = payload.new.id;
            const { data } = await supabase
              .from("profiles")
              .select("display_name, avatar")
              .eq("id", payload.new.user_id)
              .single();
            const card: Item = {
              id: submission_id,
              text: data?.display_name || "Anonymous",
              backside: true,
            };

            setCards((prevCards) => [...prevCards, card]);
          }
          if (payload.eventType === "DELETE") {
            const deletedSubmissionId = payload.old.id;
            setCards((prevCards) =>
              prevCards.filter((card) => card.id !== deletedSubmissionId)
            );
          }
        }
      )
      .subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, []);

  const handleConfirmLeave = async () => {
    try {
      // TODO: your cleanup here (leave room / update presence / etc.)
      // await supabase.rpc('leave_room', { room_id: currentRoomId, user_id: uid });
    } finally {
      // allow the original navigation to proceed
      blockNavRef.current = false;
      if (pendingActionRef.current) {
        navigation.dispatch(pendingActionRef.current);
      } else {
        // fallback
        // @ts-ignore
        router.push("/welcome");
      }
    }
  };

  const handleCancelLeave = () => {
    setConfirmVisible(false);
    pendingActionRef.current = null;
  };

  const oppScrollX = useSharedValue<number>(0);
  const oppOnScroll = useAnimatedScrollHandler((e) => {
    oppScrollX.value = e.contentOffset.x / (OPP_CARD_WIDTH + OPP_GAP);
  });

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
    //console.log("Submitted card response:", data, error, response);
    if (!error) {
      const item = hand.find((item) => item.id === id);
      if (item) addToStack(item);
      setHand((prev) => prev.filter((item) => item.id !== id));
      return true;
    } else {
      //console.error("Error submitting cards:", error);
      return false;
    }
  };

  const addToStack = (item: Item) => setCards((prev) => [...prev, item]);

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={[styles.container]}>
        <ImageBackground
          style={{ flex: 1, width: "100%" }}
          source={require("../assets/images/bg.jpg")}
          imageStyle={{
            opacity: 0.3,
            resizeMode: "cover",
          }}
        >
          <StatusBar style="light" />

          <View style={{ flex: 1, width: "100%" }}>
            {/* Opponent hand (optional) */}
            {/* <OpponentHand
            hand={hand}
            removeById={removeById}
            scrollX={oppScrollX}
            onScroll={oppOnScroll}
            card_width={OPP_CARD_WIDTH}
            gap={OPP_GAP}
          /> */}
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
            onCancel={handleCancelLeave}
            onConfirm={handleConfirmLeave}
          />
        </ImageBackground>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E0E0E",
    alignItems: "center",
    justifyContent: "center",
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
