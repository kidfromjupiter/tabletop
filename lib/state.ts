import { Item } from "@/components/ui/repeating-card-stack/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

// ===== Shared types (reuse across screens) =====
export type Player = {
  id: string;
  name: string;
  avatar?: string; // emoji or url
  isHost?: boolean;
  isReady?: boolean;
  score?: number;
};

export type GameSettings = {
  roomCode: string;
  isPrivate: boolean;
  familyMode: boolean;
  roundLimit: number; // 0 = unlimited
  scoreLimit: number; // 0 = unlimited
  handSize: number; // e.g., 10
  packs: string[]; // pack IDs or names
};

export type Submission = {
  id: string; // submission id
  playerId?: string; // optional reference to player
  texts: string[]; // one or more white card texts
  revealed?: boolean;
};

export type Phase =
  | "welcome"
  | "create"
  | "join"
  | "lobby"
  | "judge"
  | "reveal"
  | "results"
  | "round";

export type RoundData = {
  roundId: string;
  prompt: string;
  pickCount: number; // 1 or 2
  submissions: Submission[];
  timeLeftSec?: number;
  timeTotalSec?: number;
  winnerId?: string; // player id
  winningSubmissionId?: string; // submission id
  judgeId?: string; // player id
};

export type StoreState = {
  // identity & room
  me: { id: string; name: string; avatar?: string } | null;
  isHost: boolean;
  phase: Phase;
  settings: GameSettings;
  players: Player[];
  round: RoundData | null;

  // ui
  busy: boolean;
  error?: string | null;

  // cards and hand
  cards: Item[];
  hand: Item[];

  // ===== Actions =====
  reset: () => void;

  // identity
  setMe: (me: StoreState["me"]) => void;
  setBusy: (busy: boolean) => void;
  setError: (msg: string | null) => void;

  // room lifecycle
  createRoom: (
    hostName: string,
    settings: Omit<GameSettings, "roomCode"> & { roomCode: string }
  ) => void;
  joinRoom: (roomCode: string) => void;
  leaveRoom: () => void;

  // settings
  updateSettings: (patch: Partial<GameSettings>) => void;
  toggleFamilyMode: (val?: boolean) => void;
  setPacks: (packs: string[]) => void;

  // players
  addPlayer: (p: Player) => void;
  setPlayers: (p: Player[]) => void;
  updatePlayer: (id: string, patch: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  setReady: (id: string, ready: boolean) => void;
  promoteToHost: (id: string) => void;
  kick: (id: string) => void;

  // phase flow
  toPhase: (p: Phase) => void;
  toLobby: () => void;
  startRound: (
    roundId: string,
    prompt: string,
    pickCount: number,
    judgeId: string
  ) => void;
  submitForPlayer: (submission: Submission) => void;
  revealSubmission: (submissionId: string) => void;
  revealAll: () => void;
  pickWinner: (submissionId: string, id: string) => void;

  // timer
  setTimer: (left: number, total: number) => void;

  // cards and hand
  setCards: (cards: Item[]) => void;
  setHand: (hand: Item[]) => void;
  addCard: (card: Item) => void;
  removeCardFromHand: (id: string) => void;
};

const initialSettings: GameSettings = {
  roomCode: "",
  isPrivate: true,
  familyMode: false,
  roundLimit: 8,
  scoreLimit: 10,
  handSize: 10,
  packs: ["base"],
};
const initialState: Omit<
  StoreState,
  | "reset"
  | "setMe"
  | "setBusy"
  | "setError"
  | "createRoom"
  | "joinRoom"
  | "leaveRoom"
  | "updateSettings"
  | "toggleFamilyMode"
  | "setPacks"
  | "addPlayer"
  | "updatePlayer"
  | "removePlayer"
  | "setPlayers"
  | "setReady"
  | "promoteToHost"
  | "kick"
  | "shuffleJudges"
  | "toPhase"
  | "toLobby"
  | "startRound"
  | "submitForPlayer"
  | "revealSubmission"
  | "revealAll"
  | "pickWinner"
  | "confirmWinner"
  | "nextRound"
  | "setTimer"
  | "setCards"
  | "setHand"
  | "addCard"
  | "removeCardFromHand"
> = {
  me: null,
  isHost: false,
  phase: "welcome",
  settings: initialSettings,
  players: [
    { id: "1", name: "Kavi", isHost: true, isReady: true },
    { id: "2", name: "Alex", isReady: false },
  ],
  round: null,
  busy: false,
  error: null,
  cards: [],
  hand: [],
};

export const useGameStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        reset: () => set(() => ({ ...initialState })),

        setMe: (me) => set({ me }),
        setBusy: (busy) => set({ busy }),
        setError: (error) => set({ error }),

        createRoom: (hostName, settingsIn) => {
          const id = `p_${Math.random().toString(36).slice(2, 8)}`;
          const me = { id, name: hostName };
          const settings: GameSettings = { ...initialSettings, ...settingsIn };
          set({
            me,
            isHost: true,
            settings,
            players: [{ id, name: hostName, isHost: true, isReady: true }],
            phase: "lobby",
          });
        },

        joinRoom: (roomCode) => {
          const settings = get().settings ?? { ...initialSettings, roomCode };
          set((s) => ({
            isHost: false,
            settings: { ...settings, roomCode },
            players: [...s.players],
            phase: "lobby",
          }));
        },

        leaveRoom: () => set({ ...initialState, phase: "welcome" }),

        updateSettings: (patch) =>
          set((s) => ({
            settings: s.settings
              ? { ...s.settings, ...patch }
              : { ...initialSettings, ...patch },
          })),
        toggleFamilyMode: (val) =>
          set((s) => ({
            settings: s.settings
              ? { ...s.settings, familyMode: val ?? !s.settings.familyMode }
              : { ...initialSettings, familyMode: !!val },
          })),
        setPacks: (packs) =>
          set((s) => ({
            settings: s.settings
              ? { ...s.settings, packs }
              : { ...initialSettings, packs },
          })),

        addPlayer: (p) =>
          set((s) => {
            const players = s.players.some((x) => x.id === p.id)
              ? s.players
              : [...s.players, p];
            const myId = s.me?.id;
            const iAmHost = players.some((pl) => pl.isHost && pl.id === myId);
            return { players, isHost: iAmHost };
          }),
        updatePlayer: (id, patch) =>
          set((s) => {
            const players = s.players.map((p) =>
              p.id === id ? { ...p, ...patch } : p
            );
            const myId = s.me?.id;
            const iAmHost = players.some((pl) => pl.isHost && pl.id === myId);
            return { players, isHost: iAmHost };
          }),
        setPlayers: (players) =>
          set((s) => {
            const myId = s.me?.id;
            console.log(myId);
            const iAmHost = players.some((pl) => pl.isHost && pl.id === myId);

            console.log(iAmHost);
            return { players, isHost: iAmHost };
          }),
        removePlayer: (id) =>
          set((s) => ({ players: s.players.filter((p) => p.id !== id) })),
        setReady: (id, ready) =>
          set((s) => ({
            players: s.players.map((p) =>
              p.id === id ? { ...p, isReady: ready } : p
            ),
          })),
        promoteToHost: (id) =>
          set((s) => ({
            players: s.players.map((p) => ({ ...p, isHost: p.id === id })),
            isHost: s.me?.id === id,
          })),
        kick: (id) =>
          set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

        toPhase: (p) => set({ phase: p }),
        toLobby: () => set({ phase: "lobby" }),

        startRound: (roundId, prompt, pickCount, judgeId) =>
          set((s) => ({
            phase: "judge",
            round: {
              roundId,
              prompt,
              pickCount,
              submissions: [],
              timeLeftSec: undefined,
              timeTotalSec: undefined,
              judgeId,
            },
          })),

        submitForPlayer: (submission) =>
          set((s) => ({
            round: s.round
              ? {
                  ...s.round,
                  submissions: [
                    ...s.round.submissions.filter(
                      (x) => x.id !== submission.id
                    ),
                    submission,
                  ],
                }
              : s.round,
          })),

        revealSubmission: (submissionId) =>
          set((s) => ({
            round: s.round
              ? {
                  ...s.round,
                  submissions: s.round.submissions.map((sub) =>
                    sub.id === submissionId ? { ...sub, revealed: true } : sub
                  ),
                }
              : s.round,
          })),

        revealAll: () =>
          set((s) => ({
            round: s.round
              ? {
                  ...s.round,
                  submissions: s.round.submissions.map((sub) => ({
                    ...sub,
                    revealed: true,
                  })),
                }
              : s.round,
          })),

        pickWinner: (submissionId, id) =>
          set((s) => {
            const winnerId: string = id;
            // increment score in players
            const players = s.players.map((p) =>
              p.id === winnerId
                ? { ...p, score: (p as any).score ? (p as any).score + 1 : 1 }
                : p
            );
            return {
              players,
              phase: "reveal",
              round: {
                ...s.round!,
                winnerId,
                winningSubmissionId: submissionId,
                submissions: s.round!.submissions.map((x) => ({
                  ...x,
                  revealed: true,
                })),
              },
            } as any;
          }),

        setTimer: (left, total) =>
          set((s) => ({
            round: s.round
              ? { ...s.round, timeLeftSec: left, timeTotalSec: total }
              : s.round,
          })),

        setCards: (cards) => set({ cards }),
        setHand: (hand) => set({ hand }),
        addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
        removeCardFromHand: (id) =>
          set((state) => ({
            hand: state.hand.filter((item) => item.id !== id),
          })),
      }),
      {
        name: "tabletop-party-store",
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  )
);

// ===== Selectors (examples) =====
export const usePlayers = () => useGameStore((s) => s.players);
export const useMe = () => useGameStore((s) => s.me);
export const useIsHost = () => useGameStore((s) => s.isHost);
export const useSettings = () => useGameStore((s) => s.settings);
export const usePhase = () => useGameStore((s) => s.phase);
export const useRound = () => useGameStore((s) => s.round);
export const useBusy = () => useGameStore((s) => s.busy);

// ===== Usage snippets =====
/**
 * // WelcomeScreen
 * const toCreate = useGameStore((s) => s.toPhase);
 * <Button title="Create Game" onPress={() => toCreate('create')} />
 * <Button title="Join Game" variant="secondary" onPress={() => toCreate('join')} />
 *
 * // CreateGameScreen
 * const createRoom = useGameStore((s) => s.createRoom);
 * const updateSettings = useGameStore((s) => s.updateSettings);
 * createRoom(hostName, { ...settings, roomCode });
 *
 * // JoinGameScreen
 * const joinRoom = useGameStore((s) => s.joinRoom);
 * joinRoom(name, roomCode);
 *
 * // LobbyScreen
 * const { players, setReady, shuffleJudges, toPhase } = useGameStore((s) => ({
 *   players: s.players,
 *   setReady: s.setReady,
 *   shuffleJudges: s.shuffleJudges,
 *   toPhase: s.toPhase,
 * }));
 *
 * // JudgeViewScreen
 * const { round, revealSubmission, pickWinner, confirmWinner, revealAll } = useGameStore((s) => ({
 *   round: s.round,
 *   revealSubmission: s.revealSubmission,
 *   pickWinner: s.pickWinner,
 *   confirmWinner: s.confirmWinner,
 *   revealAll: s.revealAll,
 * }));
 *
 * // RevealSequenceScreen
 * const { round, toPhase } = useGameStore((s) => ({ round: s.round, toPhase: s.toPhase }));
 *
 * // RoundResultsScreen
 * const nextRound = useGameStore((s) => s.nextRound);
 */
