"use client";

import dynamic from "next/dynamic";
import { useGameStore } from "@/store/gameStore";
import Hub from "@/components/Hub";

// R3F canvas must be client-only (no SSR). Always mounted for attract-mode continuity.
const GameCanvas = dynamic(() => import("@/components/GameCanvas"), { ssr: false });

export default function Home() {
  const view = useGameStore((s) => s.view);
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <GameCanvas />
      {view !== "match" && <Hub />}
    </main>
  );
}
