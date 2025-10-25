import type { RevealItem } from "@/app/round-results";
import { RevealRow } from "@/components/pages/round-results/reveal-row";
import { Button, IconButton } from "@/components/ui/button";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/constants/supabase";
import { useGameStore } from "@/lib/state";
import { Ionicons } from "@expo/vector-icons";
import {
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RevealSequenceScreen({
  onFinished,
  onBack,
}: {
  onFinished?: (winnerId?: string) => void; // called after winner highlight shown
  onBack?: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const prompt = useGameStore((state) => state.round?.prompt || "");
  const [submissionCards, setSubmissionCards] = React.useState<RevealItem[]>(
    []
  );
  const roundId = useGameStore((state) => state.round?.roundId);
  const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  React.useEffect(() => {
    (async () => {
      const { data: submissions } = await supabase
        .from("round_submissions")
        .select(
          "profiles(display_name, avatar, id), id, round_submission_items(answer_cards(text)), revealed"
        )
        .eq("round_id", roundId);
      const submissionCards = submissions?.map((submission: any) => {
        return {
          id: submission.id,
          texts: submission.round_submission_items.map(
            (item: any) => item.answer_cards.text
          ),
          visible: submission.revealed,
        };
      });
      setSubmissionCards(submissionCards || []);
    })();
    const sub = supabase.channel("schema-db-changes").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "round_submissions",
        filter: `round_id=eq.${roundId}`,
      },
      async (payload: RealtimePostgresChangesPayload<any>) => {
        if (payload.eventType === "UPDATE") {
          const { data, error } = await supabase
            .from("round_submissions")
            .select(
              "profiles(display_name, avatar, id), round_submission_items(answer_cards(text))"
            )
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setSubmissionCards((items) =>
              items.map((item) =>
                item.id === payload.new.id
                  ? {
                      id: payload.new.id,
                      texts: data.round_submission_items.map(
                        (item: any) => item.answer_cards.text
                      ),
                      visible: payload.new.revealed,
                    }
                  : item
              )
            );
          }
        }
        if (payload.eventType === "INSERT") {
          const { data, error } = await supabase
            .from("round_submissions")
            .select(
              "profiles(display_name, avatar, id), round_submission_items(answer_cards(text))"
            )
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setSubmissionCards([
              ...submissionCards,
              {
                id: payload.new.id,
                texts: data.round_submission_items.map(
                  (item: any) => item.answer_cards.text
                ),
                visible: payload.new.revealed,

                //isWinner: data.profiles.id === meId && payload.new.is_winner,
              },
            ]);
            console.log("Received revealed submission:", data);
          }

          // Update local state with new data
        }
      }
    );
    sub.subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0E0E0E" : "#F6F6F8" }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton variant="ghost" onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={24} color="currentColor" />
        </IconButton>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]}>
          Reveal
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Prompt */}
      <Animated.View
        entering={FadeInDown.springify()}
        style={[
          styles.promptCard,
          { backgroundColor: isDark ? "#111" : "#111" },
        ]}
      >
        <Text style={styles.promptTitle}>Prompt</Text>
        <Text style={styles.promptText}>{prompt}</Text>
      </Animated.View>

      {/* Reveal list */}
      <Animated.FlatList
        data={submissionCards}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 120, gap: 8 }}
        itemLayoutAnimation={LinearTransition.springify()}
        renderItem={({ item, index }) => (
          <RevealRow
            key={item.id}
            item={item}
            visible={item.visible || false}
            isWinner={false}
            isDark={isDark}
          />
        )}
      />

      {/* Footer controls */}
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => router.push("/round-results")}
        />
      </View>
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
  title: { fontSize: 20, fontWeight: "800" },

  promptCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
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

  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16 },
});
