import { useGameStore } from "@/lib/state";

export function useRoundResults() {
  const roomCode = useGameStore((state) => state.settings.roomCode || "");
  const meId = useGameStore((state) => state.me?.id || "");
  const players = useGameStore((state) =>
    state.players.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreB - scoreA;
    })
  );
  const prompt = useGameStore((state) => state.round?.prompt || "");
  const winner = useGameStore((state) =>
    state.players.find((p) => p.id === state.round?.winnerId)
  );
  const winningCombo = useGameStore((state) =>
    state.round?.submissions.find(
      (s) => s.id === state.round?.winningSubmissionId
    )
  )!;

  return { roomCode, meId, players, prompt, winner, winningCombo };
}
