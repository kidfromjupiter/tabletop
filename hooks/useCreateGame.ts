import { useGameStore } from "@/lib/state";
import supabase from "@/lib/supabase";
import { useRouter } from "expo-router";

export function useCreateGame() {
  const router = useRouter();
  const updateSettings = useGameStore((state) => state.updateSettings);
  const setMe = useGameStore((state) => state.setMe);
  const selectedPacks = useGameStore((state) => state.settings.packs);
  const familyMode = useGameStore((state) => state.settings.familyMode);
  const roomCode = useGameStore((state) => state.settings.roomCode);
  const isPrivate = useGameStore((state) => state.settings.isPrivate);
  const roundLimit = useGameStore((state) => state.settings.roundLimit);
  const scoreLimit = useGameStore((state) => state.settings.scoreLimit);
  const handSize = useGameStore((state) => state.settings.handSize);

  async function handleStart(hostName: string) {
    if (!hostName.trim()) {
      throw new Error("Please enter your display name.");
    }
    if (!roomCode.trim() || roomCode.length < 4) {
      throw new Error("Please use a 4–8 character room code.");
    }
    if (selectedPacks.length === 0) {
      throw new Error("Please select at least one pack.");
    }

    const normalized = familyMode
      ? selectedPacks.filter((p) => !p.is_nsfw)
      : selectedPacks;

    const settings = {
      roomCode: roomCode.toUpperCase(),
      isPrivate,
      familyMode,
      roundLimit: Math.max(0, roundLimit),
      scoreLimit: Math.max(0, scoreLimit),
      handSize: Math.max(4, Math.min(15, handSize)),
      packs: normalized,
    };

    const { data, error } = await supabase.functions.invoke("endpoints", {
      body: {
        action: "create_room",
        payload: {
          code: settings.roomCode,
          is_private: settings.isPrivate,
          family_mode: settings.familyMode,
          round_limit: settings.roundLimit,
          score_limit: settings.scoreLimit,
          hand_size: settings.handSize,
          display_name: hostName.trim(),
          packs: selectedPacks.map((p) => p.id),
        },
      },
    });

    if (error) {
      throw new Error("Failed to create room.");
    }

    setMe({
      id: data.room.host_id,
      name: hostName.trim(),
    });

    updateSettings(settings);
    router.navigate("/lobby");
  }

  return { handleStart };
}
