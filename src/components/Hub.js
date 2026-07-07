"use client";

import { useGameStore, ENTRY_FEE, MATCH_ALLOCATION, FAUCET_AMOUNT } from "@/store/gameStore";

export default function Hub() {
  const hubBalance = useGameStore((s) => s.hubBalance);
  const faucet = useGameStore((s) => s.faucet);
  const joinMatch = useGameStore((s) => s.joinMatch);
  const lastResult = useGameStore((s) => s.lastResult);

  const canJoin = hubBalance >= ENTRY_FEE;

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(56,189,248,0.15),transparent_60%)]" />

      <div className="panel relative w-full max-w-xl rounded-2xl p-8">
        <div className="mb-1 text-xs uppercase tracking-[0.4em] text-neon/70">Vegas on Steroids</div>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-white glow">
          HIGH<span className="text-gold">·</span>STAKES
        </h1>

        {lastResult && (
          <div
            className={`mb-6 rounded-lg border p-4 text-sm ${
              lastResult.payout > 0
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                : "border-danger/50 bg-danger/10 text-red-300"
            }`}
          >
            {lastResult.message}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-neon/25 bg-black/40 p-5">
          <div className="text-xs uppercase tracking-widest text-slate-400">Hub Wallet</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gold glow">{hubBalance.toLocaleString()}</span>
            <span className="text-sm text-slate-400">Fake Credits</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="rounded-lg border border-slate-700 bg-black/30 p-3">
            <div className="text-slate-500">Entry Fee</div>
            <div className="text-lg font-semibold text-white">{ENTRY_FEE.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-black/30 p-3">
            <div className="text-slate-500">Match Tokens</div>
            <div className="text-lg font-semibold text-white">{MATCH_ALLOCATION.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={faucet}
            className="flex-1 rounded-xl border border-neon/50 bg-neon/10 px-5 py-3 font-semibold text-neon transition hover:bg-neon/20"
          >
            + Faucet ({FAUCET_AMOUNT.toLocaleString()})
          </button>
          <button
            onClick={joinMatch}
            disabled={!canJoin}
            className={`flex-[1.4] rounded-xl px-5 py-3 font-bold uppercase tracking-wider transition ${
              canJoin
                ? "bg-gold text-black hover:brightness-110"
                : "cursor-not-allowed bg-slate-800 text-slate-500"
            }`}
          >
            {canJoin ? "Join City ▸" : "Insufficient Funds"}
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-500">
          Enter the floor, win token wagers against AI NPCs, then reach the Extraction Zone before an
          AI Hunter intercepts you. Survive the roulette to bank your tokens.
        </p>
      </div>
    </div>
  );
}
