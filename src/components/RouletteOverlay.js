"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";

// Weighted roulette: win chance proportional to each side's wager.
export default function RouletteOverlay() {
  const extraction = useGameStore((s) => s.extraction);
  const npcs = useGameStore((s) => s.npcs);
  const playerTokens = useGameStore((s) => s.playerTokens);
  const resolveRoulette = useGameStore((s) => s.resolveRoulette);
  const addLog = useGameStore((s) => s.addLog);

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [done, setDone] = useState(null);
  const startedRef = useRef(false);

  const isRoulette = extraction && extraction.phase === "roulette";
  const hunter = npcs.find((n) => n.id === extraction?.hunterId);

  // Hunter wagers a calculated slice of its stack (bolder when it out-banks player).
  const hunterWager = hunter
    ? Math.max(500, Math.round(hunter.tokens * (hunter.tokens > playerTokens ? 0.6 : 0.35)))
    : 0;
  const playerWager = playerTokens;
  const pool = playerWager + hunterWager;
  const playerShare = pool > 0 ? playerWager / pool : 0.5;

  useEffect(() => {
    if (isRoulette) {
      startedRef.current = false;
      setSpinning(false);
      setRotation(0);
      setDone(null);
    }
  }, [isRoulette]);

  if (!isRoulette || !hunter) return null;

  const spin = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setSpinning(true);

    const playerWon = Math.random() < playerShare;
    // Land the pointer (top, 0deg) inside the correct slice.
    // Player slice occupies [0, playerShare*360); hunter the remainder.
    const slice = playerWon
      ? Math.random() * playerShare * 360
      : playerShare * 360 + Math.random() * (1 - playerShare) * 360;
    const target = 360 * 6 + (360 - slice); // several full turns then align
    setRotation(target);

    setTimeout(() => {
      setSpinning(false);
      setDone(playerWon);
      addLog(playerWon ? "Survived the extraction roulette." : "Destroyed at extraction.");
    }, 4200);
  };

  const playerDeg = playerShare * 360;
  const gradient = `conic-gradient(#22c55e 0deg ${playerDeg}deg, #ef4444 ${playerDeg}deg 360deg)`;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur">
      <div className="panel w-full max-w-md rounded-2xl p-7 text-center">
        <div className="mb-1 text-xs uppercase tracking-[0.3em] text-danger glow">The Escarpment</div>
        <h2 className="mb-1 text-2xl font-bold text-white">Extraction Roulette</h2>
        <p className="mb-5 text-xs text-slate-400">Winner takes the pool. Loser is destroyed.</p>

        <div className="relative mx-auto mb-5 h-56 w-56">
          <div className="absolute left-1/2 top-[-10px] z-10 -translate-x-1/2 border-x-8 border-t-[16px] border-x-transparent border-t-white" />
          <div
            className="h-56 w-56 rounded-full border-4 border-slate-700"
            style={{
              background: gradient,
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.15,0.9,0.2,1)" : "none",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-2 border-slate-600 bg-[#06070c] text-[10px] leading-[4rem] text-slate-400">
              {(playerShare * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-3">
            <div className="text-xs text-slate-400">You wager</div>
            <div className="font-semibold text-emerald-400">{playerWager.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-3">
            <div className="text-xs text-slate-400">Hunter wagers</div>
            <div className="font-semibold text-red-400">{hunterWager.toLocaleString()}</div>
          </div>
        </div>

        {done === null ? (
          <button
            onClick={spin}
            disabled={spinning}
            className="w-full rounded-xl bg-gold py-3 font-bold uppercase tracking-wider text-black transition hover:brightness-110 disabled:opacity-50"
          >
            {spinning ? "Spinning…" : "Spin the Wheel"}
          </button>
        ) : (
          <div>
            <div
              className={`mb-4 text-3xl font-bold glow ${
                done ? "text-emerald-400" : "text-danger"
              }`}
            >
              {done ? "EXTRACTED" : "DESTROYED"}
            </div>
            <button
              onClick={() => resolveRoulette(done, pool)}
              className="w-full rounded-xl bg-neon py-3 font-bold text-black transition hover:brightness-110"
            >
              {done ? `Bank ${pool.toLocaleString()} Tokens` : "Return to Hub"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
