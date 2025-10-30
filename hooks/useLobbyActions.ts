import { useGameStore } from "@/lib/state";
import supabase from "@/lib/supabase";
import { useRouter } from "expo-router";

export function useLobbyActions() {
  const router = useRouter();
  const meId = useGameStore((state) => state.me?.id || "");
  const settings = useGameStore((state) => state.settings);
  const setMe = useGameStore((state) => state.setMe);
  const setSettings = useGameStore((state) => state.updateSettings);

  const leaveRoom = async () => {
    const { error } = await supabase.functions.invoke("endpoints", {
      body: {
        action: "leave_room",
        payload: {
          user_id: meId,
          room_code: settings.roomCode,
        },
      },
    });
    if (!error) {
      setMe(null);
      setSettings({ roomCode: "" });
      router.dismissTo("/welcome");
    }
  };

  const toggleReady = async () => {
    await supabase.functions.invoke("endpoints", {
      body: {
        action: "toggle_ready",
        payload: {
          user_id: meId,
          room_code: settings?.roomCode,
          is_ready: !useGameStore.getState().players.find((p) => p.id === meId)
            ?.isReady,
        },
      },
    });
  };

  const startRound = async () => {
    await supabase.functions.invoke("endpoints", {
      body: {
        action: "start_round",
        payload: {
          room_code: settings?.roomCode,
          user_id: meId,
        },
      },
    });
  };

  return { leaveRoom, toggleReady, startRound };
}
