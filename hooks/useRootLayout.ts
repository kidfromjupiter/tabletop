import { useGameStore } from "@/lib/state";

export function useRootLayout() {
  const roundId = useGameStore((state) => state.round?.roundId);
  const addCard = useGameStore((state) => state.addCard);
  const me = useGameStore((state) => state.me);
  const roomCode = useGameStore((state) => state.settings.roomCode);
  const setRoundData = useGameStore((state) => state.startRound);
  const setCards = useGameStore((state) => state.setCards);
  const setHand = useGameStore((state) => state.setHand);
  const setRound = useGameStore((state) => state.startRound);
  const addPlayer = useGameStore((state) => state.addPlayer);
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const removePlayer = useGameStore((state) => state.removePlayer);
  const setPlayers = useGameStore((state) => state.setPlayers);
  const pickWinner = useGameStore((state) => state.pickWinner);
  const submitForPlayer = useGameStore((state) => state.submitForPlayer);
  const setPacks = useGameStore((state) => state.setPacks);
  const updateSettings = useGameStore((state) => state.updateSettings);

  return {
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
  };
}
