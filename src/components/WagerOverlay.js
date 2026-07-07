"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/store/gameStore";

// Simple bluff / risk model: NPC "confidence" biases the coin.
function resolveOutcome(npcTokens, amount) {
  // NPC risk tolerance: richer NPCs play slightly bolder (edge in their favor),
  // plus a bluff factor. Player base win chance ~50%, nudged by variance.
  const bluff = Math.random(); // NPC's hidden confidence
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
  const [phase, setPhase] = useState("bet"); // bet | reveal
  const [result, setResult] = useState(null);

  if (activeWagerNpc === null || !npc) return null;

  const maxWager = Math.min(playerTokens, npc.tokens);

  const play = () => {
    const wager = Math.min(amount, maxWager);
    const outcome = resolveOutcome(npc.tokens, wager);
    setResult({ ...outcome, wager });
    setPhase("reveal");
  };

  const finish = () => {
    resolveWager(npc.id, result.wager, result.playerWon);
    addLog(
      result.playerWon
        ? `Won ${result.wager.toLocaleString()} from NPC #${npc.id}.`
        : `Lost ${result.wager.toLocaleString()} to NPC #${npc.id}.`
    );
    setPhase("bet");
    setResult(null);
    closeWager();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="panel w-full max-w-md rounded-2xl p-7">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.3em] text-danger">Wager Table</div>
          <div className="text-xs text-slate-500">NPC #{npc.id}</div>
        </div>
        <h2 className="mb-5 text-2xl font-bold text-white">High-Card Standoff</h2>

        <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-neon/30 bg-black/40 p-3">
            <div className="text-xs text-slate-500">Your Tokens</div>
            <div className="text-lg font-semibold text-neon">{playerTokens.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-danger/30 bg-black/40 p-3">
            <div className="text-xs text-slate-500">NPC Tokens</div>
            <div className="text-lg font-semibold text-red-400">{npc.tokens.toLocaleString()}</div>
          </div>
        </div>

        {phase === "bet" && (
          <>
            <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">
              Wager: <span className="text-gold">{Math.min(amount, maxWager).toLocaleString()}</span>
            </label>
            <input
              type="range"
              min={100}
              max={Math.max(100, maxWager)}
              step={100}
              value={Math.min(amount, maxWager)}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mb-6 w-full accent-gold"
            />
            <div className="flex gap-3">
              <button
                onClick={closeWager}
                className="flex-1 rounded-xl border border-slate-700 py-3 text-slate-300 transition hover:bg-slate-800"
              >
                Walk Away
              </button>
              <button
                onClick={play}
                disabled={maxWager < 100}
                className="flex-[1.5] rounded-xl bg-gold py-3 font-bold uppercase tracking-wider text-black transition hover:brightness-110 disabled:opacity-40"
              >
                Draw Cards
              </button>
            </div>
          </>
        )}

        {phase === "reveal" && result && (
          <div className="text-center">
            <div
              className={`mb-3 text-3xl font-bold glow ${
                result.playerWon ? "text-emerald-400" : "text-danger"
              }`}
            >
              {result.playerWon ? "YOU WIN" : "NPC WINS"}
            </div>
            <p className="mb-6 text-sm text-slate-400">
              {result.playerWon
                ? `You take ${result.wager.toLocaleString()} tokens.`
                : `You forfeit ${result.wager.toLocaleString()} tokens.`}
            </p>
            <button
              onClick={finish}
              className="w-full rounded-xl bg-neon py-3 font-bold text-black transition hover:brightness-110"
            >
              Collect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
