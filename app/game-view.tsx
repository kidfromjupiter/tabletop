import { useGameStore } from "@/lib/state";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function GameRedirect() {
  const router = useRouter();
  const round = useGameStore((state) => state.round);
  const me = useGameStore((state) => state.me);

  useEffect(() => {
    if (!me || !round) return;

    const isJudge = round.judgeId === me.id;

    if (isJudge) {
      router.replace("/judge-view");
    } else {
      router.replace("/player-view");
    }
  }, [me, round]);

  return null;
}
