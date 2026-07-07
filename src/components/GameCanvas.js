"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, ContactShadows } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore, EXTRACTION_SECONDS } from "@/store/gameStore";
import WagerOverlay from "./WagerOverlay";
import RouletteOverlay from "./RouletteOverlay";
import Lighting from "./three/Lighting";
import Floor from "./three/Floor";
import PlayerAvatar from "./three/PlayerAvatar";
import Npc from "./three/Npc";
import WagerTable from "./three/WagerTable";
import ExtractionVault from "./three/ExtractionVault";
import Effects from "./three/Effects";
import AttractMode from "./three/AttractMode";
import { sfx, toggleMute, isMuted } from "@/lib/audio";
import {
  BOUND,
  WAGER_RADIUS,
  EXTRACT_RADIUS,
  CATCH_RADIUS,
  EXTRACT_POS,
  TABLE_POSITIONS,
  clampBound,
} from "./three/constants";

function Tables() {
  return (
    <>
      {TABLE_POSITIONS.map((p, i) => (
        <WagerTable key={i} position={p} />
      ))}
    </>
  );
}

function Scene({ setPrompt, moveRef }) {
  const npcs = useGameStore((s) => s.npcs);
  const playerRef = useRef();
  const npcRefs = useRef({});
  const camRef = useRef();

  const playerPos = useRef(new THREE.Vector3(0, 0, 0));
  const playerTarget = useRef(new THREE.Vector3(0, 0, 0));
  const keys = useRef({});
  const npcPos = useRef({});
  const lastPromptKey = useRef("");
  const introT = useRef(0); // push-in easing on match start

  // Expose click-to-move target setter to the shared Floor raycast.
  useEffect(() => {
    if (moveRef) moveRef.current = (x, z) => playerTarget.current.set(clampBound(x), 0, clampBound(z));
    return () => {
      if (moveRef) moveRef.current = null;
    };
  }, [moveRef]);

  useEffect(() => {
    npcPos.current = {};
    npcs.forEach((n) => {
      npcPos.current[n.id] = {
        pos: new THREE.Vector3(n.x, 0, n.z),
        target: new THREE.Vector3(n.tx, 0, n.tz),
      };
    });
    playerPos.current.set(0, 0, 0);
    playerTarget.current.set(0, 0, 0);
    introT.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npcs.length]);

  useEffect(() => {
    const down = (e) => (keys.current[e.key.toLowerCase()] = true);
    const up = (e) => (keys.current[e.key.toLowerCase()] = false);
    const interact = (e) => {
      if (e.key.toLowerCase() !== "e") return;
      const st = useGameStore.getState();
      if (st.activeWagerNpc !== null || st.extraction) return;
      let best = null;
      let bestD = WAGER_RADIUS;
      st.npcs.forEach((n) => {
        const p = npcPos.current[n.id]?.pos;
        if (!p) return;
        const d = p.distanceTo(playerPos.current);
        if (d < bestD) {
          bestD = d;
          best = n.id;
        }
      });
      if (best !== null) {
        sfx.click();
        st.openWager(best);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("keydown", interact);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("keydown", interact);
    };
  }, []);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = useGameStore.getState();
    const paused = st.activeWagerNpc !== null || (st.extraction && st.extraction.phase === "roulette");

    // --- Player movement ---
    if (!paused) {
      const speed = 9;
      const k = keys.current;
      let mx = 0;
      let mz = 0;
      if (k["w"] || k["arrowup"]) mz -= 1;
      if (k["s"] || k["arrowdown"]) mz += 1;
      if (k["a"] || k["arrowleft"]) mx -= 1;
      if (k["d"] || k["arrowright"]) mx += 1;
      if (mx || mz) {
        const len = Math.hypot(mx, mz);
        playerPos.current.x = clampBound(playerPos.current.x + (mx / len) * speed * dt);
        playerPos.current.z = clampBound(playerPos.current.z + (mz / len) * speed * dt);
        playerTarget.current.copy(playerPos.current);
      } else {
        const to = playerTarget.current.clone().sub(playerPos.current);
        const dist = to.length();
        if (dist > 0.1) {
          to.normalize();
          const step = Math.min(dist, speed * dt);
          playerPos.current.x = clampBound(playerPos.current.x + to.x * step);
          playerPos.current.z = clampBound(playerPos.current.z + to.z * step);
        }
      }
    }
    if (playerRef.current) playerRef.current.position.copy(playerPos.current);

    // --- Camera follow with intro push-in + trauma shake ---
    if (camRef.current) {
      introT.current = Math.min(1, introT.current + dt / 1.1);
      const intro = 1 - Math.pow(1 - introT.current, 3); // easeOutCubic 0->1
      const zoom = THREE.MathUtils.lerp(1.5, 1.0, intro); // start pulled back, push in
      const desired = new THREE.Vector3(
        playerPos.current.x + 22 * zoom,
        24 * zoom,
        playerPos.current.z + 22 * zoom
      );
      camRef.current.position.lerp(desired, 0.08);

      // trauma-based screen shake (decays)
      let trauma = st.trauma;
      if (trauma > 0) {
        const shake = trauma * trauma;
        const t = state.clock.elapsedTime * 40;
        camRef.current.position.x += Math.sin(t) * shake * 1.2;
        camRef.current.position.y += Math.cos(t * 1.3) * shake * 0.9;
        st.setTrauma(Math.max(0, trauma - dt * 1.4));
      }

      const idle = state.clock.elapsedTime;
      camRef.current.lookAt(
        playerPos.current.x + Math.sin(idle * 0.3) * 0.15,
        1 + Math.sin(idle * 0.5) * 0.1,
        playerPos.current.z
      );
    }

    // --- NPC movement ---
    st.npcs.forEach((n) => {
      const data = npcPos.current[n.id];
      const ref = npcRefs.current[n.id];
      if (!data) return;
      if (n.state === "hunter") {
        const to = playerPos.current.clone().sub(data.pos);
        const dist = to.length();
        if (dist > 0.05) {
          to.normalize();
          data.pos.x = clampBound(data.pos.x + to.x * 7 * dt);
          data.pos.z = clampBound(data.pos.z + to.z * 7 * dt);
          if (ref) ref.rotation.y = Math.atan2(to.x, to.z);
        }
      } else if (!paused) {
        const to = data.target.clone().sub(data.pos);
        if (to.length() < 0.6) {
          data.target.set((Math.random() - 0.5) * BOUND * 1.8, 0, (Math.random() - 0.5) * BOUND * 1.8);
        } else {
          to.normalize();
          data.pos.x = clampBound(data.pos.x + to.x * 3 * dt);
          data.pos.z = clampBound(data.pos.z + to.z * 3 * dt);
          if (ref) ref.rotation.y = THREE.MathUtils.lerp(ref.rotation.y, Math.atan2(to.x, to.z), 0.08);
        }
      }
      if (ref) ref.position.copy(data.pos);
    });

    // --- Elimination ---
    if (st.view === "match" && st.playerTokens <= 0 && !st.extraction) {
      sfx.lose();
      st.eliminatePlayer();
      return;
    }

    // --- Extraction logic ---
    const distToExtract = playerPos.current.distanceTo(EXTRACT_POS);
    if (!st.extraction && st.activeWagerNpc === null && distToExtract < EXTRACT_RADIUS && st.playerTokens > 0) {
      let hunter = st.npcs[0]?.id ?? 0;
      let bestD = Infinity;
      st.npcs.forEach((n) => {
        const p = npcPos.current[n.id]?.pos;
        if (!p) return;
        const d = p.distanceTo(playerPos.current);
        if (d < bestD) {
          bestD = d;
          hunter = n.id;
        }
      });
      sfx.alarm();
      st.startExtraction(hunter);
    }

    if (st.extraction && st.extraction.phase === "running") {
      st.tickExtraction(dt);
      const fresh = useGameStore.getState().extraction;
      const hunterPos = npcPos.current[fresh.hunterId]?.pos;
      if (hunterPos && hunterPos.distanceTo(playerPos.current) < CATCH_RADIUS) {
        st.addTrauma(0.8);
        sfx.lose();
        st.triggerRoulette();
      } else if (fresh.timeLeft <= 0) {
        sfx.win();
        st.extractionEscape();
      }
    }

    // --- Proximity prompt ---
    let promptKey = "";
    if (!st.extraction && st.activeWagerNpc === null) {
      if (distToExtract < EXTRACT_RADIUS + 2) promptKey = "extract";
      else {
        let near = false;
        for (const n of st.npcs) {
          const p = npcPos.current[n.id]?.pos;
          if (p && p.distanceTo(playerPos.current) < WAGER_RADIUS) {
            near = true;
            break;
          }
        }
        if (near) promptKey = "wager";
      }
    }
    if (promptKey !== lastPromptKey.current) {
      lastPromptKey.current = promptKey;
      setPrompt(promptKey);
    }
  });

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault fov={30} position={[22, 24, 22]} near={0.1} far={300} />
      <PlayerAvatar groupRef={playerRef} />
      {npcs.map((n) => (
        <Npc key={n.id} npc={n} groupRef={(el) => (npcRefs.current[n.id] = el)} />
      ))}
      <ExtractionVault />
    </>
  );
}

// Shared world (always rendered); switches camera/entities on view.
function World({ setPrompt }) {
  const view = useGameStore((s) => s.view);
  const moveRef = useRef(null);
  return (
    <>
      <color attach="background" args={["#160d0d"]} />
      <fog attach="fog" args={["#160d0d", 42, 130]} />
      <Lighting />
      <Floor onMove={(x, z) => moveRef.current?.(x, z)} />
      <Tables />
      <ContactShadows position={[0, 0.04, 0]} scale={BOUND * 2.4} blur={2.6} opacity={0.55} far={12} resolution={512} color="#000000" />
      {view === "match" ? <Scene setPrompt={setPrompt} moveRef={moveRef} /> : <AttractMode />}
      <Effects />
    </>
  );
}

function RadialTimer({ timeLeft }) {
  const pct = timeLeft / EXTRACTION_SECONDS;
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <svg width="86" height="86" viewBox="0 0 86 86" className="mx-auto">
      <circle cx="43" cy="43" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle
        cx="43"
        cy="43"
        r={R}
        fill="none"
        stroke="#ef4444"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - pct)}
        transform="rotate(-90 43 43)"
        style={{ transition: "stroke-dashoffset 0.12s linear" }}
      />
      <text x="43" y="49" textAnchor="middle" className="fill-white font-display text-[20px] tabular">
        {timeLeft.toFixed(1)}
      </text>
    </svg>
  );
}

function ExtractionHud() {
  const extraction = useGameStore((s) => s.extraction);
  if (!extraction || extraction.phase !== "running") return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 text-center">
      <div className="mb-2 text-[11px] uppercase tracking-[0.35em] text-red-400 gold-glow">
        Cashier Cage · Hunter Inbound
      </div>
      <RadialTimer timeLeft={extraction.timeLeft} />
    </div>
  );
}

function HudBar({ prompt }) {
  const playerTokens = useGameStore((s) => s.playerTokens);
  const log = useGameStore((s) => s.log);
  const [muted, setMutedState] = useState(false);
  return (
    <>
      <div className="pointer-events-none absolute left-5 top-5 z-20">
        <div className="lux-panel rounded-2xl px-5 py-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-gold/70">Match Tokens</div>
          <div className="font-display text-3xl font-bold gold-foil tabular">{playerTokens.toLocaleString()}</div>
        </div>
      </div>

      <button
        onClick={() => setMutedState(toggleMute())}
        className="absolute right-5 top-5 z-20 rounded-full hairline-gold bg-black/40 px-3 py-2 text-xs text-gold backdrop-blur transition hover:bg-black/60"
      >
        {muted ? "Sound Off" : "Sound On"}
      </button>

      <div className="pointer-events-none absolute bottom-5 left-5 z-20 w-72 space-y-1">
        {log.map((l, i) => (
          <div
            key={l.id}
            style={{ opacity: Math.max(0.35, 1 - i * 0.12) }}
            className="rounded-lg border border-gold/15 bg-black/45 px-3 py-1 text-[11px] text-cream/85 backdrop-blur-sm"
          >
            {l.msg}
          </div>
        ))}
      </div>

      {prompt && (
        <div className="pointer-events-none absolute bottom-10 left-1/2 z-20 -translate-x-1/2">
          <div className="lux-panel rounded-full px-6 py-2.5 text-sm text-cream">
            {prompt === "wager" ? (
              <>
                Press <span className="font-bold text-gold-light">E</span> to sit at the table
              </>
            ) : (
              <>
                Enter the <span className="font-bold text-gold-light">Cashier Cage</span> to extract
              </>
            )}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-5 right-5 z-20 text-right text-[11px] text-cream/40">
        WASD / click to move · reach the cage to bank tokens
      </div>
    </>
  );
}

export default function GameCanvas() {
  const [prompt, setPrompt] = useState("");
  const view = useGameStore((s) => s.view);
  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true }} camera={{ position: [0, 20, 30] }}>
        <World setPrompt={setPrompt} />
      </Canvas>
      {view === "match" && (
        <>
          <HudBar prompt={prompt} />
          <ExtractionHud />
        </>
      )}
      <WagerOverlay />
      <RouletteOverlay />
    </div>
  );
}
