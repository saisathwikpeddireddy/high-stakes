"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { sfx } from "@/lib/audio";

// Weighted roulette: win chance proportional to each side's wager.
export default function RouletteOverlay() {
  const extraction = useGameStore((s) => s.extraction);
  const npcs = useGameStore((s) => s.npcs);
  const playerTokens = useGameStore((s) => s.playerTokens);
  const resolveRoulette = useGameStore((s) => s.resolveRoulette);
  const addTrauma = useGameStore((s) => s.addTrauma);
  const addLog = useGameStore((s) => s.addLog);

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [done, setDone] = useState(null);
  const startedRef = useRef(false);
  const tickRef = useRef(null);

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
    return () => clearInterval(tickRef.current);
  }, [isRoulette]);

  if (!isRoulette || !hunter) return null;

  const spin = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setSpinning(true);
    sfx.spin();

    // ratchet ticks that slow down over the spin
    let delay = 60;
    const scheduleTick = () => {
      tickRef.current = setTimeout(() => {
        sfx.tick();
        delay = Math.min(400, delay * 1.12);
        if (delay < 380) scheduleTick();
      }, delay);
    };
    scheduleTick();

    const playerWon = Math.random() < playerShare;
    const slice = playerWon
      ? Math.random() * playerShare * 360
      : playerShare * 360 + Math.random() * (1 - playerShare) * 360;
    const target = 360 * 6 + (360 - slice);
    setRotation(target);

    setTimeout(() => {
      clearTimeout(tickRef.current);
      setSpinning(false);
      setDone(playerWon);
      if (playerWon) sfx.win();
      else {
        sfx.lose();
        addTrauma(0.6);
      }
      addLog(playerWon ? "Survived the extraction roulette." : "Destroyed at extraction.");
    }, 4200);
  };

  const playerDeg = playerShare * 360;
  const gradient = `conic-gradient(#0f5132 0deg ${playerDeg / 2}deg, #157a4d ${playerDeg / 2}deg ${playerDeg}deg, #7f1d1d ${playerDeg}deg ${(playerDeg + 360) / 2}deg, #b91c1c ${(playerDeg + 360) / 2}deg 360deg)`;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="lux-panel w-full max-w-md rounded-3xl p-8 text-center"
      >
        <div className="mb-1 text-[11px] uppercase tracking-[0.35em] text-red-400 gold-glow">The Cage Wheel</div>
        <h2 className="mb-1 font-display text-3xl font-bold text-cream">Extraction Roulette</h2>
        <p className="mb-6 text-xs text-cream/40">Winner takes the pool. Loser is destroyed.</p>

        <div className="relative mx-auto mb-6 h-60 w-60">
          {/* pointer */}
          <div className="absolute left-1/2 top-[-6px] z-20 -translate-x-1/2">
            <div className="h-0 w-0 border-x-[10px] border-t-[18px] border-x-transparent border-t-gold-light drop-shadow-[0_0_6px_rgba(212,175,55,0.7)]" />
          </div>
          {/* outer gold rim */}
          <div className="absolute inset-0 rounded-full border-[6px] border-gold shadow-gold" />
          <div
            className="absolute inset-[6px] rounded-full"
            style={{
              background: gradient,
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.12,0.85,0.15,1)" : "none",
            }}
          />
          {/* studs */}
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-light"
              style={{ transform: `rotate(${i * 22.5}deg) translateY(-108px)` }}
            />
          ))}
          {/* gold hub */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-gradient-to-b from-walnut to-black font-display text-lg text-gold-light tabular gold-glow">
              {(playerShare * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-emerald-600/40 bg-emerald-900/20 p-4">
            <div className="text-xs text-cream/40">You wager</div>
            <div className="font-display font-semibold text-emerald-300 tabular">{playerWager.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-red-500/40 bg-red-900/20 p-4">
            <div className="text-xs text-cream/40">Hunter wagers</div>
            <div className="font-display font-semibold text-red-300 tabular">{hunterWager.toLocaleString()}</div>
          </div>
        </div>

        {done === null ? (
          <button
            onClick={spin}
            disabled={spinning}
            className="btn-gold w-full rounded-xl py-3.5 font-display font-bold uppercase tracking-[0.15em] disabled:opacity-50"
          >
            {spinning ? "Spinning…" : "Spin the Wheel"}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className={`mb-4 font-display text-4xl font-bold gold-glow ${done ? "gold-foil" : "text-red-400"}`}>
              {done ? "EXTRACTED" : "DESTROYED"}
            </div>
            <button
              onClick={() => resolveRoulette(done, pool)}
              className="btn-gold w-full rounded-xl py-3.5 font-display font-bold uppercase tracking-[0.15em]"
            >
              {done ? `Bank ${pool.toLocaleString()} Tokens` : "Return to Hub"}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
