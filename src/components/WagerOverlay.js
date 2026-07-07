"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { sfx } from "@/lib/audio";

// Simple bluff / risk model: NPC "confidence" biases the coin.
function resolveOutcome(npcTokens, amount) {
  const bluff = Math.random();
  const houseEdge = 0.04 * (npcTokens > amount * 3 ? 1 : 0.5);
  const playerWinChance = 0.5 - houseEdge + (bluff - 0.5) * 0.1;
  const roll = Math.random();
  return { playerWon: roll < playerWinChance, roll, playerWinChance };
}

export default function WagerOverlay() {
  const activeWagerNpc = useGameStore((s) => s.activeWagerNpc);
  const npcs = useGameStore((s) => s.npcs);
  const playerTokens = useGameStore((s) => s.playerTokens);
  const resolveWager = useGameStore((s) => s.resolveWager);
  const closeWager = useGameStore((s) => s.closeWager);
  const addLog = useGameStore((s) => s.addLog);

  const npc = useMemo(() => npcs.find((n) => n.id === activeWagerNpc), [npcs, activeWagerNpc]);
  const [amount, setAmount] = useState(500);
  const [phase, setPhase] = useState("bet"); // bet | dealing | reveal
  const [result, setResult] = useState(null);

  if (activeWagerNpc === null || !npc) return null;

  const maxWager = Math.min(playerTokens, npc.tokens);

  const play = () => {
    const wager = Math.min(amount, maxWager);
    const outcome = resolveOutcome(npc.tokens, wager);
    setResult({ ...outcome, wager });
    setPhase("dealing");
    sfx.card();
    setTimeout(() => sfx.card(), 250);
    // brief suspense before reveal
    setTimeout(() => {
      setPhase("reveal");
      outcome.playerWon ? sfx.win() : sfx.lose();
    }, 1100);
  };

  const finish = () => {
    sfx.chip();
    resolveWager(npc.id, result.wager, result.playerWon);
    addLog(
      result.playerWon
        ? `Won ${result.wager.toLocaleString()} at the table.`
        : `Lost ${result.wager.toLocaleString()} at the table.`
    );
    setPhase("bet");
    setResult(null);
    closeWager();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md">
      {/* radial felt glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(15,81,50,0.4),transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="lux-panel relative w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.35em] text-gold/70">Wager Table</div>
          <div className="text-xs text-cream/40">Croupier #{npc.id}</div>
        </div>
        <h2 className="mb-6 font-display text-3xl font-bold text-cream">High-Card Standoff</h2>

        <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl hairline-gold bg-black/40 p-4">
            <div className="text-xs text-cream/40">Your Tokens</div>
            <div className="font-display text-xl font-semibold gold-foil tabular">{playerTokens.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-black/40 p-4">
            <div className="text-xs text-cream/40">House Tokens</div>
            <div className="font-display text-xl font-semibold text-red-300 tabular">{npc.tokens.toLocaleString()}</div>
          </div>
        </div>

        {phase === "bet" && (
          <>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-cream/50">
              Wager: <span className="text-gold-light tabular">{Math.min(amount, maxWager).toLocaleString()}</span>
            </label>
            <input
              type="range"
              min={100}
              max={Math.max(100, maxWager)}
              step={100}
              value={Math.min(amount, maxWager)}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mb-7 w-full accent-gold"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  sfx.click();
                  closeWager();
                }}
                className="flex-1 rounded-xl hairline-gold py-3.5 text-cream/70 transition hover:bg-white/5"
              >
                Walk Away
              </button>
              <button
                onClick={play}
                disabled={maxWager < 100}
                className="btn-gold flex-[1.5] rounded-xl py-3.5 font-display font-bold uppercase tracking-[0.15em] disabled:opacity-40"
              >
                Draw Cards
              </button>
            </div>
          </>
        )}

        {phase === "dealing" && (
          <div className="py-8 text-center">
            <div className="mb-4 flex justify-center gap-3">
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  initial={{ rotateY: 0, y: -20, opacity: 0 }}
                  animate={{ rotateY: 180, y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  className="h-24 w-16 rounded-lg border border-gold/40 bg-gradient-to-b from-walnut to-black shadow-gold"
                />
              ))}
            </div>
            <p className="text-sm tracking-[0.2em] text-cream/50">Dealing…</p>
          </div>
        )}

        <AnimatePresence>
          {phase === "reveal" && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className={`mb-3 font-display text-4xl font-bold gold-glow ${result.playerWon ? "gold-foil" : "text-red-400"}`}>
                {result.playerWon ? "YOU WIN" : "HOUSE WINS"}
              </div>
              <p className="mb-6 text-sm text-cream/50">
                {result.playerWon
                  ? `You take ${result.wager.toLocaleString()} tokens.`
                  : `You forfeit ${result.wager.toLocaleString()} tokens.`}
              </p>
              <button
                onClick={finish}
                className="btn-gold w-full rounded-xl py-3.5 font-display font-bold uppercase tracking-[0.15em]"
              >
                Collect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
