import { useGameStore } from "@/lib/state";
import supabase from "@/lib/supabase";
import { router, usePathname } from "expo-router";
import { useState } from "react";
import { ToastAndroid } from "react-native";

export function useJudgeActions() {
  const meId = useGameStore((state) => state.me?.id);
  const roomCode = useGameStore((state) => state.settings.roomCode);
  const roundId = useGameStore((state) => state.round?.roundId);
  const setMe = useGameStore((state) => state.setMe);
  const setSettings = useGameStore((state) => state.updateSettings);
  const submitForPlayer = useGameStore((state) => state.submitForPlayer);
  const pathname = usePathname();

  const [prompt, setPrompt] = useState("Loading prompt...");
  const [expectedSubmissions, setExpectedSubmissions] = useState(0);

  const leaveRoom = async () => {
    const { error } = await supabase.functions.invoke("endpoints", {
      body: {
        action: "leave_room",
        payload: {
          user_id: meId,
          room_code: roomCode,
        },
      },
    });
    if (!error) {
      setMe(null);
      setSettings({ roomCode: "" });
      router.dismissTo("/welcome");
    }
  };

  const revealCard = async (submission_id: string) => {
    await supabase.functions.invoke("endpoints", {
      body: {
        action: "reveal_submission",
        payload: {
          round_id: roundId,
          user_id: meId,
          submission_id,
        },
      },
    });
  };

  const skipPrompt = async () => {
    const { data, error } = await supabase.functions.invoke("endpoints", {
      body: {
        action: "skip_prompt",
        payload: {
          round_id: roundId,
          user_id: meId,
        },
      },
    });
    if (!error) {
      setPrompt(data.prompt.text);
    }
  };

  const confirmWinner = async (selectedId: string | null) => {
    if (!selectedId) {
      ToastAndroid.showWithGravity(
        "Please select a winner before confirming.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      return;
    }
    await supabase.functions.invoke("endpoints", {
      body: {
        action: "judge_pick",
        payload: {
          round_id: roundId,
          user_id: meId,
          submission_id: selectedId,
        },
      },
    });
    if (pathname !== "/winner-screen") {
      // winner screen is routed to automatically from the listener. So we avoid double navigation.
      router.navigate("/winner-screen");
    }
  };

  const fetchRoomState = async () => {
    const { data: roomState } = await supabase.functions.invoke("endpoints", {
      body: {
        action: "room_state",
        payload: {
          room_code: useGameStore.getState().settings.roomCode,
          user_id: useGameStore.getState().me?.id,
        },
      },
    });
    setPrompt(roomState.round.prompt.text);

    roomState.round.judge_view?.map((submission: any) => {
      submitForPlayer({
        id: submission.submission_id,
        texts: submission.cards.map((card: any) => card.text),
        revealed: false,
      });
    });
    setExpectedSubmissions(roomState.round.expected_submissions);
  };

  return {
    prompt,
    expectedSubmissions,
    leaveRoom,
    revealCard,
    skipPrompt,
    confirmWinner,
    fetchRoomState,
  };
}
