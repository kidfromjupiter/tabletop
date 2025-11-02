// src/stage/StageContext.tsx
import React, { createContext, useContext } from "react";

export type StageMetrics = {
  baseWidth: number; // e.g., 390
  baseHeight: number; // e.g., 844
  scale: number; // viewport → phone scale factor
  stageW: number; // baseWidth * scale (actual rendered width)
  stageH: number; // baseHeight * scale (actual rendered height)
  vw: number; // viewport width
  vh: number; // viewport height
  sp: (v: number) => number; // "stage px" => screen px (v * scale)
};

const StageContext = createContext<StageMetrics | null>(null);

export function useStage() {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error("useStage must be used within <MobileStage>");
  return ctx;
}

export function StageProvider({
  value,
  children,
}: {
  value: StageMetrics;
  children: React.ReactNode;
}) {
  return (
    <StageContext.Provider value={value}>{children}</StageContext.Provider>
  );
}
