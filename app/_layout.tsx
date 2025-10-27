import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { Item } from "@/components/ui/repeating-card-stack/types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/constants/supabase";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Player, Submission, useGameStore } from "@/lib/state";
import {
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const roundId = useGameStore((state) => state.round?.roundId);
  const addCard = useGameStore((state) => state.addCard);
  const me = useGameStore((state) => state.me);
  const roomCode = useGameStore((state) => state.settings.roomCode);
  const round = useGameStore((state) => state.round); // --- IGNORE ---
  const setRoundData = useGameStore((state) => state.startRound);
  const setCards = useGameStore((state) => state.setCards);
  const setHand = useGameStore((state) => state.setHand);

  const setRound = useGameStore((state) => state.startRound); // --- IGNORE ---
  const addPlayer = useGameStore((state) => state.addPlayer); // --- IGNORE ---
  const updatePlayer = useGameStore((state) => state.updatePlayer); // --- IGNORE ---
  const removePlayer = useGameStore((state) => state.removePlayer); // --- IGNORE ---
  const setPlayers = useGameStore((state) => state.setPlayers); // --- IGNORE ---
  const pickWinner = useGameStore((state) => state.pickWinner); // --- IGNORE ---
  const submitForPlayer = useGameStore((state) => state.submitForPlayer); // --- IGNORE ---
  const updateSettings = useGameStore((state) => state.updateSettings); // --- IGNORE ---

  //const navigation = useNavigation();
  const router = useRouter();

  // lobby stuff

  // TODO: move away from supabase postgres changes to supabase realtime functions
  // Right now we're using a random UUID in place of roundId to avoid subscription issues

  useEffect(() => {
    console.log("useEffect lobby sub roundId, roomCode:", roundId, roomCode);
    if (!roomCode) return;
    console.log("Room code exists, setting up lobby subscriptions");
    (async () => {
      setPlayers([]); // reset on mount
      // Pull current state (join profiles for richer UI)
      const { data, error } = await supabase
        .from("room_players")
        .select(
          `
      user_id, role, is_ready, score, joined_at,
      profiles ( display_name, avatar ),
      rooms!inner ( code, packs )
    `
        )
        .eq("rooms.code", roomCode) // filter on joined table
        .order("joined_at", { ascending: true });
      if (!error && data) {
        const mapped: Player[] = data.map((r: any) => ({
          id: r.user_id,
          name: r.profiles.display_name,
          avatar: r.profiles.avatar,
          isHost: r.role === "host",
          isReady: r.is_ready,
          score: r.score,
        }));
        setPlayers(mapped);
        const { data: packsData, error: packsError } = await supabase
          .from("packs")
          .select("*")
          // @ts-ignore
          .in("id", data[0].rooms.packs);
        if (!packsError && packsData) {
          updateSettings({ packs: packsData });
        }
      }
    })();
    const supabaseChannel = supabase
      .channel("schema-db-changes")
      .on(
        // listener for round submissions
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "round_submissions",
          filter: `round_id=eq.${roundId || global.crypto.randomUUID()}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.table !== "round_submissions") return; // sometimes gets called for other tables?
          if (payload.eventType === "INSERT") {
            const submission_id = payload.new.id;
            const { data } = await supabase
              .from("round_submissions")
              .select(
                `
    id,
    user_id,
    profiles ( id, display_name ),
    round_submission_items (
      submission_id,
      answer_cards ( text )
    )
  `
              )
              .eq("id", payload.new.id)
              .single();
            if (payload.new.user_id !== me?.id) {
              // not my own card. so should show backside
              const card: Item = {
                id: submission_id,
                // @ts-ignore
                text: data?.profiles.display_name || "Anonymous",
                backside: true,
              };
              addCard(card);
            }
            submitForPlayer({
              id: submission_id,
              // @ts-ignore
              texts: [data?.round_submission_items[0].answer_cards.text],
              revealed: false,
              playerId: data?.user_id,
            });
          }
        }
      )
      .on(
        // round listener
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rounds",
          filter: `room_code=eq.${roomCode}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.table !== "rounds") return; // sometimes gets called for other tables?
          if (payload.eventType === "INSERT") {
            // created a new round, navigate to game view
            const roundData = payload.new;

            setRound(
              roundData.id,
              roundData.prompt,
              roundData.pick_count,
              roundData.judge_user_id
            );
            router.replace("/game-view");
            console.log("New round created, navigating to game view");
            console.log("payload:", payload);
          }
          if (payload.eventType === "UPDATE") {
            if (payload.new.winning_submission_id) {
              const { data } = await supabase
                .from("round_submissions")
                .select("profiles ( id)")
                .eq("id", payload.new.winning_submission_id)
                .single();
              pickWinner(
                payload.new.winning_submission_id,
                // @ts-ignore
                data?.profiles.id
              );
            }

            if (payload.new.prompt_id != payload.old.prompt_id) {
              // prompt was skipped
              console.log("Prompt was skipped, clearing cards");
              console.log("new payload:", payload.new);
              console.log("old payload:", payload.old);
              const { data, error } = await supabase
                .from("prompt_cards")
                .select("text")
                .eq("id", payload.new.prompt_id)
                .maybeSingle();
              if (data && !error) {
                setRound(
                  payload.new.id,
                  data.text,
                  payload.new.pick_count,
                  payload.new.judge_user_id
                );
              }
            }
            //if (payload.new.status === "ended") {
            //  // round ended, navigate to round results
            //  router.replace("/round-results");
            //}
          }
        }
      )
      .on(
        // player listener
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
          filter: `room_code=eq.${roomCode}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.table !== "room_players") return; // sometimes gets called for other tables?
          //console.log("Lobby player change payload:", payload);
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", payload.new.user_id)
            .single();

          if (payload.eventType === "INSERT") {
            const newPlayer = payload.new;
            addPlayer({
              id: newPlayer.user_id,
              name: data.display_name,
              isHost: newPlayer.role == "host",
              isReady: newPlayer.is_ready,
              avatar: data.avatar,
              score: newPlayer.score,
            });
          }
          if (payload.eventType === "UPDATE") {
            const updatedPlayer = payload.new;
            updatePlayer(updatedPlayer.user_id, {
              name: data.display_name,
              isHost: updatedPlayer.role == "host",
              isReady: updatedPlayer.is_ready,
              avatar: data.avatar,
              score: updatedPlayer.score,
            });
          }
          if (payload.eventType === "DELETE") {
            const deletedPlayer = payload.old;
            removePlayer(deletedPlayer.user_id);
          }
        }
      )
      .subscribe((status, error) => {
        console.log("lobby supabase status:", status, error);
      });
    console.log("roomcode lobby subbed:", roomCode);

    return () => {
      console.log("unsubbed");
      supabaseChannel.unsubscribe();
      supabase.removeChannel(supabaseChannel);
    };
  }, [roundId, roomCode, me]);
  // player-view stuff
  useEffect(() => {
    if (!me || !roundId || !roomCode) return;
    (async () => {
      console.log("calling endpoints to get round data for player-view");
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
      const submissionsForStore: Submission[] =
        submissions?.map((submission: any) => ({
          id: submission.id,
          texts: submission.round_submission_items.map(
            (rsi: any) => rsi.answer_cards.text
          ),
          revealed: false,
          playerId: submission.profiles.id,
        })) || [];
      setRoundData(
        roomState.round.id || "",
        roomState.round.prompt.text,
        roomState.round.pick_count,
        roomState.round.judge_user_id,
        submissionsForStore
      );
      updateSettings({ packs: roomState.room.packs }); // --- IGNORE ---
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
  }, [me, roomCode, roundId, round?.prompt]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: "#F6F6F8" },
            headerTintColor: "#111",
            freezeOnBlur: true,
          }}
        >
          <Stack.Screen
            name="welcome"
            options={{ title: "Welcome" }}
            initialParams={{
              appName: "Tabletop Party",
              tagline: "A terrible game for terribly funny people.",
            }}
          />
          <Stack.Screen
            name="player-view"
            options={{ title: "Game" }}
            initialParams={{
              roomCode: "ABCD5",
              playerId: "p1",
            }}
          />
          <Stack.Screen
            name="round-results"
            options={{ title: "Round Results" }}
          />
          <Stack.Screen
            name="reveal-sequence"
            options={{ title: "Reveal Sequence" }}
            initialParams={{
              prompt: "Why can't I sleep at night?",
              items: [
                {
                  id: "a",
                  texts: ["A romantic candlelit dinner with homicide."],
                },
                { id: "b", texts: ["Bees?"] },
                { id: "c", texts: ["A mime having a stroke."], isWinner: true },
              ],
            }}
          />
          <Stack.Screen
            name="judge-view"
            options={{ title: "Judge View" }}
            initialParams={{
              prompt: "Why can't I sleep at night?",
              pickCount: 1,
              submissions: [
                {
                  id: "a",
                  texts: ["A romantic candlelit dinner with homicide."],
                  revealed: false,
                },
                { id: "b", texts: ["Bees?"], revealed: true },
                {
                  id: "c",
                  texts: ["A mime having a stroke."],
                  revealed: false,
                },
                {
                  id: "d",
                  texts: ["The miracle of childbirth."],
                  revealed: true,
                },
              ],
              totalPlayers: 5,
              timeLeftSec: 20,
              timeTotalSec: 60,
            }}
          />
          <Stack.Screen
            name="lobby"
            options={{ title: "Lobby" }}
            initialParams={{
              isHost: true,
              players: [
                { id: "1", name: "Kavi", isHost: true, isReady: true },
                { id: "2", name: "Alex", isReady: false },
              ],
              meId: "1",
              settings: {
                roomCode: "ABCD5",
                isPrivate: true,
                familyMode: false,
                roundLimit: 8,
                scoreLimit: 10,
                handSize: 10,
              },
            }}
          />
          <Stack.Screen
            name="create-game"
            options={{ title: "Create Game" }}
            initialParams={{ defaultName: "" }}
          />
          <Stack.Screen
            name="join-game"
            options={{ title: "Join Game" }}
            initialParams={{
              defaultName: "Alex",
              lastSession: { roomCode: "ABCD5", name: "Alex" },
            }}
          />
        </Stack>

        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
