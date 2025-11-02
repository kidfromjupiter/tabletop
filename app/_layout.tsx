import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import MobileStage from "@/components/mobile-stage";
import { Item } from "@/components/ui/repeating-card-stack/types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/constants/supabase";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRootLayout } from "@/hooks/useRootLayout";
import { Player, Submission } from "@/lib/state";
import { showToast, ToastProvider } from "@/lib/toast";
import { SoundEffectsProvider } from "@/providers/sfx-provider";
import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ColorSchemeName, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

function AppContent({ colorScheme }: { colorScheme: ColorSchemeName }) {
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <ToastProvider>
          <SoundEffectsProvider>
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
              <Stack.Screen name="winner-screen" />
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
                    {
                      id: "c",
                      texts: ["A mime having a stroke."],
                      isWinner: true,
                    },
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
          </SoundEffectsProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const {
    roundId,
    addCard,
    me,
    roomCode,
    setRoundData,
    setCards,
    setHand,
    setRound,
    addPlayer,
    updatePlayer,
    removePlayer,
    setPlayers,
    pickWinner,
    submitForPlayer,
    setPacks,
    updateSettings,
    leaveRoom,
    revealSubmission,
  } = useRootLayout();

  //const navigation = useNavigation();
  const router = useRouter();

  // lobby stuff

  useEffect(() => {
    if (!roomCode) return;
    (async () => {
      setPlayers([]); // reset on mount
      // Pull current state (join profiles for richer UI)
      const { data, error } = await supabase
        .from("room_players")
        .select(
          `
      user_id, role, is_ready, score, joined_at,
      profiles ( display_name, avatar ),
      rooms!inner ( code, packs,round_limit, score_limit, hand_size)
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
        console.log(data[0].rooms);
        updateSettings({
          // @ts-ignore
          roundLimit: data[0].rooms.round_limit,
          // @ts-ignore
          scoreLimit: data[0].rooms.score_limit,
          // @ts-ignore
          handSize: data[0].rooms.hand_size,
        });
        const { data: packsData, error: packsError } = await supabase
          .from("packs")
          .select("*")
          // @ts-ignore
          .in("id", data[0].rooms.packs);
        if (!packsError && packsData) {
          setPacks(packsData);
        }
      }
    })();
    const roomChannel: RealtimeChannel = supabase
      .channel(roomCode, {
        config: {
          private: false, // RLS/auth off for now
          broadcast: { ack: true }, // request ack, optional
        },
      })
      .on("broadcast", { event: "GAME_FINISHED" }, (msg: any) => {
        console.log("GAME_FINISHED event received:", msg);
        router.navigate("/winner-screen");
      })

      .on("broadcast", { event: "KICK_PLAYER" }, (msg: any) => {
        const p = msg.payload;
        console.log("KICK_PLAYER event:", p);
        if (p.user_id === me?.id) {
          // I got kicked!
          leaveRoom();
          router.replace("/welcome");
          showToast(" You have been kicked from the room.");
        }
      })

      // INSERT events (round_submissions INSERT, room_players INSERT, rounds INSERT)
      .on("broadcast", { event: "INSERT" }, async (msg: any) => {
        console.log(msg);
        console.log(msg.table);
        const { table, new: rowNew } = msg.payload || {};
        if (!table || !rowNew) return;

        // --- round_submissions: someone just submitted cards
        if (table === "round_submissions") {
          const submission_id = rowNew.id;

          // fetch the rich submission with player + cards
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
            .eq("id", submission_id)
            .single();

          // If it's not my own submission, show backside card with player's display name
          if (rowNew.user_id !== me?.id) {
            const card: Item = {
              id: submission_id,
              // @ts-ignore
              text: data?.profiles.display_name || "Anonymous",
              backside: true,
            };
            addCard(card);
          }

          // Add the submitted card (front) to local round state
          submitForPlayer({
            id: submission_id,
            // @ts-ignore
            texts: [data?.round_submission_items[0].answer_cards.text],
            revealed: false,
            playerId: data?.user_id,
          });
        }

        // --- rounds: a brand new round got created
        if (table === "rounds") {
          // new round was started; navigate players into game view
          const roundData = rowNew;
          setRound(
            roundData.id,
            roundData.prompt, // NOTE: if you don't actually store prompt text inline on rounds,
            // you may need to fetch it via prompt_id first.
            roundData.pick_count,
            roundData.judge_user_id
          );

          router.navigate("/game-view");
          console.log("New round created, navigating to game view");
          console.log("INSERT rounds payload:", msg);
        }

        // --- room_players: someone joined the lobby
        if (table === "room_players") {
          const newPlayer = rowNew;
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newPlayer.user_id)
            .single();

          if (!error && data) {
            addPlayer({
              id: newPlayer.user_id,
              name: data.display_name,
              isHost: newPlayer.role == "host",
              isReady: newPlayer.is_ready,
              avatar: data.avatar,
              score: newPlayer.score,
            });
          }
        }
      })

      // UPDATE events (rounds UPDATE, room_players UPDATE, round_submissions UPDATE if you ever allow edits)
      .on("broadcast", { event: "UPDATE" }, async (msg: any) => {
        const { table, new: rowNew, old: rowOld } = msg.payload || {};
        if (!table || !rowNew) return;

        // --- rounds: score winner picked, prompt skipped, etc.
        if (table === "rounds") {
          // 1. Winner picked
          if (rowNew.winning_submission_id) {
            const { data } = await supabase
              .from("round_submissions")
              .select("profiles ( id )")
              .eq("id", rowNew.winning_submission_id)
              .single();

            pickWinner(
              rowNew.winning_submission_id,
              // @ts-ignore
              data?.profiles.id
            );
          }
        }

        // --- room_players: player readiness / score / host role changed
        if (table === "room_players") {
          const updatedPlayer = rowNew;
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", updatedPlayer.user_id)
            .single();

          if (!error && data) {
            updatePlayer(updatedPlayer.user_id, {
              name: data.display_name,
              isHost: updatedPlayer.role == "host",
              isReady: updatedPlayer.is_ready,
              avatar: data.avatar,
              score: updatedPlayer.score,
            });
          }
        }
        if (table == "round_submissions") {
          revealSubmission(rowNew.id);
        }

        // --- round_submissions:
        // If you ever reveal cards / flip state / etc. by updating,
        // you could handle that here by checking table === "round_submissions"
        // and using rowNew.revealed vs rowOld.revealed.
      })

      // DELETE events (room_players leave, round_submissions withdrawn, etc.)
      .on("broadcast", { event: "DELETE" }, (msg: any) => {
        const { table, old: rowOld } = msg.payload || {};
        if (!table || !rowOld) return;

        // --- room_players: player left lobby
        if (table === "room_players") {
          const deletedPlayer = rowOld;
          removePlayer(deletedPlayer.user_id);
        }

        // --- round_submissions: if you ever allow someone to retract submission
        // if (table === "round_submissions") {
        //   removeSubmission(rowOld.id);
        // }
      })

      // OPTIONAL: custom semantic events from triggers
      // e.g. broadcast_round_prompt_skipped() calling realtime.send(..., 'PROMPT_SKIPPED', ...)
      .on("broadcast", { event: "PROMPT_SKIPPED" }, async (msg: any) => {
        const p = msg.payload;
        console.log("PROMPT_SKIPPED event:", p);

        // You probably still want to load the new prompt text by new_prompt_id:
        const { data, error } = await supabase
          .from("prompt_cards")
          .select("text")
          .eq("id", p.new_prompt_id)
          .maybeSingle();

        if (!error && data) {
          console.log("set round again");
          console.log(data);
          setRound(p.round_id, data.text, p.new_pick_count, p.judge_user_id);

          const card: Item = {
            id: p.new_prompt_id,
            // @ts-ignore
            text: data.text,
            prompt: true,
          };
          setCards([card]);
        }

        // Clear any submitted cards in local UI if needed, etc.
      })

      .subscribe((status, error) => {
        console.log("roomChannel status:", status, error);
      });
    console.log("roomcode lobby subbed:", roomCode);

    return () => {
      console.log("unsubbed");
      roomChannel.unsubscribe();
      supabase.removeChannel(roomChannel);
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
      setPacks(roomState.room.packs);
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
  }, [me, roomCode, roundId]);

  if (Platform.OS == "web") {
    return (
      <MobileStage>
        <AppContent colorScheme={colorScheme} />
      </MobileStage>
    );
  } else {
    return <AppContent colorScheme={colorScheme} />;
  }
}
