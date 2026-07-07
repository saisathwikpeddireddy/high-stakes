"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, ENTRY_FEE, MATCH_ALLOCATION, FAUCET_AMOUNT } from "@/store/gameStore";
import { useCountUp } from "@/lib/useCountUp";
import { sfx } from "@/lib/audio";

export default function Hub() {
  const hubBalance = useGameStore((s) => s.hubBalance);
  const faucet = useGameStore((s) => s.faucet);
  const joinMatch = useGameStore((s) => s.joinMatch);
  const lastResult = useGameStore((s) => s.lastResult);

  const displayBalance = useCountUp(hubBalance);
  const canJoin = hubBalance >= ENTRY_FEE;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-6">
      {/* darken + warm the attract scene behind the panel */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75 backdrop-blur-[3px]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="lux-panel relative w-full max-w-xl rounded-3xl p-9"
      >
        <div className="mb-1 text-center text-[11px] uppercase tracking-[0.5em] text-gold/70">
          Monte Carlo · Members Only
        </div>
        <h1 className="mb-7 text-center font-display text-6xl font-extrabold tracking-tight gold-foil gold-glow">
          HIGH<span className="text-gold">·</span>STAKES
        </h1>

        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-6 overflow-hidden rounded-xl border p-4 text-center text-sm ${
                lastResult.payout > 0
                  ? "border-gold/50 bg-gold/10 text-gold-light"
                  : "border-red-500/40 bg-red-900/20 text-red-300"
              }`}
            >
              {lastResult.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-6 rounded-2xl hairline-gold bg-black/40 p-6 text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-cream/50">Hub Wallet</div>
          <div className="mt-2 flex items-baseline justify-center gap-2">
            <span className="font-display text-5xl font-bold gold-foil tabular">
              {displayBalance.toLocaleString()}
            </span>
            <span className="text-sm text-cream/40">credits</span>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl hairline-gold bg-black/30 p-4 text-center">
            <div className="text-cream/40">Entry Fee</div>
            <div className="mt-1 font-display text-xl font-semibold text-cream tabular">
              {ENTRY_FEE.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl hairline-gold bg-black/30 p-4 text-center">
            <div className="text-cream/40">Match Tokens</div>
            <div className="mt-1 font-display text-xl font-semibold text-cream tabular">
              {MATCH_ALLOCATION.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => {
              sfx.chip();
              faucet();
            }}
            className="flex-1 rounded-xl hairline-gold bg-white/5 px-5 py-3.5 font-semibold text-gold transition hover:bg-gold/10"
          >
            + Faucet ({FAUCET_AMOUNT.toLocaleString()})
          </button>
          <button
            onClick={() => {
              if (!canJoin) return;
              sfx.card();
              joinMatch();
            }}
            disabled={!canJoin}
            className={`flex-[1.4] rounded-xl px-5 py-3.5 font-display font-bold uppercase tracking-[0.15em] transition ${
              canJoin
                ? "btn-gold hover:brightness-105"
                : "cursor-not-allowed bg-white/5 text-cream/30 hairline-gold"
            }`}
          >
            {canJoin ? "Enter the Floor" : "Insufficient Funds"}
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-cream/40">
          Sit at the wager tables, out-play the house croupiers, then reach the Cashier Cage before the
          AI Hunter intercepts you. Survive the roulette to bank your winnings.
        </p>
      </motion.div>
    </div>
  );
}
