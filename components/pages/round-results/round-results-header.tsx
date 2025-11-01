import SharedHeader from "@/components/ui/header";
import React from "react";

export default function RoundResultsHeader({ isDark }: { isDark: boolean }) {
  return <SharedHeader title="Round Results" isDark={isDark} />;
}
