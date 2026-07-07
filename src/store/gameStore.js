import { create } from "zustand";

export const ENTRY_FEE = 6000;
export const MATCH_ALLOCATION = 5000;
export const STARTING_BALANCE = 50000;
export const FAUCET_AMOUNT = 10000;
export const NPC_COUNT = 7;
export const EXTRACTION_SECONDS = 15;

// Views: "hub" | "match" | "result"
export const useGameStore = create((set, get) => ({
  view: "hub",
  hubBalance: STARTING_BALANCE,

  // Active match state
  playerTokens: 0,
  npcs: [], // { id, x, z, tokens, state: "wander" | "hunter", color }
  activeWagerNpc: null, // id of npc player is negotiating with
  extraction: null, // { timeLeft, hunterId, phase: "running" | "caught" | "roulette" }
  lastResult: null, // { outcome, payout, message }
  log: [],

  addLog: (msg) =>
    set((s) => ({ log: [{ id: Date.now() + Math.random(), msg }, ...s.log].slice(0, 8) })),

  faucet: () => set((s) => ({ hubBalance: s.hubBalance + FAUCET_AMOUNT })),

  joinMatch: () => {
    const { hubBalance } = get();
    if (hubBalance < ENTRY_FEE) return false;
    const npcs = Array.from({ length: NPC_COUNT }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 16,
      z: (Math.random() - 0.5) * 16,
      tokens: 2000 + Math.floor(Math.random() * 4000),
      state: "wander",
      color: "#ef4444",
      // steering targets
      tx: (Math.random() - 0.5) * 16,
      tz: (Math.random() - 0.5) * 16,
    }));
    set({
      hubBalance: hubBalance - ENTRY_FEE,
      playerTokens: MATCH_ALLOCATION,
      npcs,
      view: "match",
      activeWagerNpc: null,
      extraction: null,
      lastResult: null,
      log: [{ id: Date.now(), msg: "Entered the City. Multiply your tokens and extract." }],
    });
    return true;
  },

  setNpcPositions: (updater) => set((s) => ({ npcs: updater(s.npcs) })),

  openWager: (npcId) => set({ activeWagerNpc: npcId }),
  closeWager: () => set({ activeWagerNpc: null }),

  resolveWager: (npcId, amount, playerWon) =>
    set((s) => {
      const npcs = s.npcs.map((n) => {
        if (n.id !== npcId) return n;
        return { ...n, tokens: playerWon ? n.tokens - amount : n.tokens + amount };
      });
      const playerTokens = playerWon ? s.playerTokens + amount : s.playerTokens - amount;
      return { npcs, playerTokens, activeWagerNpc: null };
    }),

  eliminatePlayer: () =>
    set({
      view: "result",
      lastResult: {
        outcome: "eliminated",
        payout: 0,
        message: "You went broke on the floor. Booted to the Hub.",
      },
    }),

  startExtraction: (hunterId) =>
    set((s) => ({
      extraction: { timeLeft: EXTRACTION_SECONDS, hunterId, phase: "running" },
      npcs: s.npcs.map((n) => (n.id === hunterId ? { ...n, state: "hunter", color: "#f97316" } : n)),
    })),

  tickExtraction: (dt) =>
    set((s) => {
      if (!s.extraction || s.extraction.phase !== "running") return {};
      const timeLeft = Math.max(0, s.extraction.timeLeft - dt);
      return { extraction: { ...s.extraction, timeLeft } };
    }),

  // Player reached timer end without being caught -> auto extract survive
  extractionEscape: () =>
    set((s) => {
      const payout = s.playerTokens;
      return {
        view: "result",
        hubBalance: s.hubBalance + payout,
        lastResult: {
          outcome: "escaped",
          payout,
          message: `Clean extraction. ${payout.toLocaleString()} tokens banked before the Hunter reached you.`,
        },
      };
    }),

  triggerRoulette: () =>
    set((s) => (s.extraction ? { extraction: { ...s.extraction, phase: "roulette" } } : {})),

  resolveRoulette: (playerWon, pool) =>
    set((s) => {
      if (playerWon) {
        return {
          view: "result",
          hubBalance: s.hubBalance + pool,
          extraction: null,
          lastResult: {
            outcome: "extracted",
            payout: pool,
            message: `You beat the Hunter's roulette and extracted ${pool.toLocaleString()} tokens.`,
          },
        };
      }
      return {
        view: "result",
        extraction: null,
        lastResult: {
          outcome: "destroyed",
          payout: 0,
          message: "The wheel favored the Hunter. Your avatar was destroyed. No payout.",
        },
      };
    }),

  returnToHub: () =>
    set({ view: "hub", npcs: [], playerTokens: 0, extraction: null, activeWagerNpc: null, lastResult: null }),
}));
