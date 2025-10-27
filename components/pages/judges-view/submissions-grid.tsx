import SubmissionCard from "@/components/pages/judges-view/submissions-card";
import React from "react";
import { FlatList, StyleSheet } from "react-native";

export default function SubmissionsGrid({
  submissions,
  selectedId,
  pickCount,
  onReveal,
  onSelect,
}: {
  submissions: any[];
  selectedId: string | null;
  pickCount: number;
  onReveal: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <FlatList
      data={submissions}
      keyExtractor={(s) => s.id}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.contentContainer}
      renderItem={({ item }) => (
        <SubmissionCard
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onReveal={() => onReveal(item.id)}
          onSelect={() => onSelect(item.id)}
          pickCount={pickCount}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  columnWrapper: { gap: 12, paddingHorizontal: 12 },
  contentContainer: { paddingTop: 8, paddingBottom: 120, gap: 12 },
});
