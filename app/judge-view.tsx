import JudgeFooter from "@/components/pages/judges-view/judge-footer";
import JudgeHeader from "@/components/pages/judges-view/judge-header";
import PromptCard from "@/components/pages/judges-view/prompt-card";
import SubmissionsGrid from "@/components/pages/judges-view/submissions-grid";
import ConfirmModal from "@/components/ui/modal";
import { useJudgeActions } from "@/hooks/useJudgeActions";
import { useGameStore } from "@/lib/state";
import supabase from "@/lib/supabase";
import { router, useNavigation } from "expo-router";
import * as React from "react";
import { useEffect } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * JudgeViewScreen.tsx
 * Card Czar / Judge screen for a CAH-style game.
 * - Shows the black prompt and blind submissions
 * - Tap a card to flip (reveal). Long-press to preview combo vertically
 * - Select a winner and confirm
 * - Host tools: Shuffle / Skip round
 */

export type Submission = {
  id: string;
  texts: string[]; // one or more white card texts (for 2-pick prompts)
  revealed?: boolean;
};

export default function JudgeViewScreen({
  pickCount = 1,
  timeLeftSec,
  timeTotalSec,
  onReveal,
  onRevealAll,
  onPick,
  onConfirm,
  onSkip,
  onShuffle,
  onBack,
}: {
  pickCount?: number; // 1 or 2
  timeLeftSec?: number;
  timeTotalSec?: number;
  onReveal?: (id: string) => void;
  onRevealAll?: () => void;
  onPick?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onSkip?: () => void;
  onShuffle?: () => void;
  onBack?: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  //const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const submitForPlayer = useGameStore((state) => state.submitForPlayer);
  const submissions = useGameStore((state) => state.round?.submissions || []);
  const roundId = useGameStore((state) => state.round?.roundId);
  const [clickedConfirmNoWinner, setClickedConfirmNoWinner] =
    React.useState(false);
  const [prompt, setPrompt] = React.useState("Loading prompt...");

  const {
    prompt: fetchedPrompt,
    expectedSubmissions,
    leaveRoom,
    revealCard,
    skipPrompt,
    confirmWinner,
    fetchRoomState,
  } = useJudgeActions();

  React.useEffect(() => {
    fetchRoomState();
  }, []);

  const revealedCount = submissions.filter((s) => s.revealed).length;
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const navigation = useNavigation();
  const meId = useGameStore((state) => state.me?.id);
  const roomCode = useGameStore((state) => state.settings.roomCode);
  const setMe = useGameStore((state) => state.setMe);
  const setSettings = useGameStore((state) => state.updateSettings);

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
    onPick?.(id);
  }

  useEffect(() => {
    setPrompt(fetchedPrompt);
  }, [fetchedPrompt]);

  const leaveRoomHandler = async () => {
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
      router.replace("/welcome");
    }
  };

  useEffect(() => {
    // Intercept only "back" navigations
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      console.log("ran");
      if (e.data.action.type !== "GO_BACK") return; // Allow non-back navigations
      e.preventDefault(); // stop the default behavior
      setConfirmVisible(true);
    });
    return unsub;
  }, []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      {/* Header */}
      <JudgeHeader isDark={isDark} skipPrompt={skipPrompt} />

      {/* Prompt (Black Card) */}
      <PromptCard
        isDark={isDark}
        pickCount={pickCount}
        prompt={prompt}
        submissions={submissions}
        expectedSubmissions={expectedSubmissions}
        revealedCount={revealedCount}
        onRevealAll={onRevealAll}
      />

      {/* Submissions Grid */}
      <SubmissionsGrid
        submissions={submissions}
        selectedId={selectedId}
        pickCount={pickCount}
        onReveal={revealCard}
        onSelect={handleSelect}
      />

      {/* Footer */}
      <JudgeFooter
        selectedId={selectedId}
        confirmWinner={() => confirmWinner(selectedId)}
      />

      <ConfirmModal
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={leaveRoomHandler}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerText: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 10,
    color: "#888",
  },
  title: { fontSize: 20, fontWeight: "800" },
  promptCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  promptTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  promptText: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 6 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  metaText: { color: "#CFCFCF", fontSize: 12, fontWeight: "600" },
  metaDot: { color: "#777" },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "transparent",
  },
});
