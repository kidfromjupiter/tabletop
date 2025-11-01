import SharedHeader from "@/components/ui/header";
import React from "react";

export default function Header({
  title,
  isDark,
}: {
  title: string;
  isDark: boolean;
}) {
  return <SharedHeader title={title} isDark={isDark} />;
}
