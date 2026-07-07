"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrthographicCamera, Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore, EXTRACTION_SECONDS } from "@/store/gameStore";
import WagerOverlay from "./WagerOverlay";
import RouletteOverlay from "./RouletteOverlay";

const BOUND = 18;
const WAGER_RADIUS = 3.2;
const EXTRACT_RADIUS = 3.5;
const CATCH_RADIUS = 1.6;
const EXTRACT_POS = new THREE.Vector3(BOUND - 3, 0, BOUND - 3);

function clampBound(v) {
  return Math.max(-BOUND, Math.min(BOUND, v));
}

function Ground({ onMove }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onMove(e.point.x, e.point.z);
      }}
    >
      <planeGeometry args={[BOUND * 2 + 8, BOUND * 2 + 8]} />
      <meshStandardMaterial color="#0b1020" />
    </mesh>
  );
}

function Grid() {
  return (
    <gridHelper
      args={[BOUND * 2 + 6, 28, "#1e293b", "#111a2e"]}
      position={[0, 0.01, 0]}
    />
  );
}

function ExtractionZone() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group position={[EXTRACT_POS.x, 0, EXTRACT_POS.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[EXTRACT_RADIUS - 0.3, EXTRACT_RADIUS, 48]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ref} position={[0, 1.2, 0]}>
        <torusGeometry args={[0.9, 0.12, 12, 32]} />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.8} />
      </mesh>
      <Text position={[0, 2.6, 0]} fontSize={0.7} color="#22c55e" anchorX="center">
        EXTRACT
      </Text>
    </group>
  );
}

function TokenLabel({ value, color }) {
  return (
    <Html center distanceFactor={26} position={[0, 2.1, 0]} zIndexRange={[10, 0]}>
      <div
        style={{ color, borderColor: color }}
        className="whitespace-nowrap rounded-md border bg-black/70 px-2 py-0.5 text-[11px] font-bold"
      >
        {value.toLocaleString()}
      </div>
    </Html>
  );
}

function Player({ groupRef }) {
  const tokens = useGameStore((s) => s.playerTokens);
  const inner = useRef();
  useFrame((_, dt) => {
    if (inner.current) inner.current.rotation.y += dt * 1.5;
  });
  return (
    <group ref={groupRef}>
      <mesh ref={inner} position={[0, 1, 0]}>
        <octahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.6} metalness={0.3} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} color="#38bdf8" intensity={8} distance={7} />
      <TokenLabel value={tokens} color="#38bdf8" />
    </group>
  );
}

function Npc({ npc, groupRef }) {
  const liveNpc = useGameStore((s) => s.npcs.find((n) => n.id === npc.id));
  const color = liveNpc?.state === "hunter" ? "#f97316" : "#ef4444";
  const tokens = liveNpc?.tokens ?? npc.tokens;
  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.3, 1.6, 1.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
      <TokenLabel value={tokens} color={color} />
    </group>
  );
}

function Scene({ setPrompt }) {
  const npcs = useGameStore((s) => s.npcs);
  const playerRef = useRef();
  const npcRefs = useRef({});
  const camRef = useRef();
  const { camera } = useThree();

  // Live positions (not React state, updated every frame)
  const playerPos = useRef(new THREE.Vector3(0, 0, 0));
  const playerTarget = useRef(new THREE.Vector3(0, 0, 0));
  const keys = useRef({});
  const npcPos = useRef({});
  const lastPromptKey = useRef("");

  // Init npc positions once per match
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npcs.length]);

  useEffect(() => {
    const down = (e) => (keys.current[e.key.toLowerCase()] = true);
    const up = (e) => (keys.current[e.key.toLowerCase()] = false);
    const interact = (e) => {
      if (e.key.toLowerCase() !== "e") return;
      const st = useGameStore.getState();
      if (st.activeWagerNpc !== null || st.extraction) return;
      // find nearest npc in radius
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
      if (best !== null) st.openWager(best);
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

  useFrame((_, dtRaw) => {
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
        // click-to-move
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

    // --- Camera follow (isometric offset) ---
    if (camRef.current) {
      const desired = new THREE.Vector3(
        playerPos.current.x + 22,
        24,
        playerPos.current.z + 22
      );
      camRef.current.position.lerp(desired, 0.08);
      camRef.current.lookAt(playerPos.current.x, 0, playerPos.current.z);
    }

    // --- NPC movement ---
    st.npcs.forEach((n) => {
      const data = npcPos.current[n.id];
      const ref = npcRefs.current[n.id];
      if (!data) return;
      if (n.state === "hunter") {
        // chase player
        const to = playerPos.current.clone().sub(data.pos);
        const dist = to.length();
        if (dist > 0.05) {
          to.normalize();
          data.pos.x = clampBound(data.pos.x + to.x * 7 * dt);
          data.pos.z = clampBound(data.pos.z + to.z * 7 * dt);
        }
      } else if (!paused) {
        // wander toward target, pick new target when close
        const to = data.target.clone().sub(data.pos);
        if (to.length() < 0.6) {
          data.target.set((Math.random() - 0.5) * BOUND * 1.8, 0, (Math.random() - 0.5) * BOUND * 1.8);
        } else {
          to.normalize();
          data.pos.x = clampBound(data.pos.x + to.x * 3 * dt);
          data.pos.z = clampBound(data.pos.z + to.z * 3 * dt);
        }
      }
      if (ref) ref.position.copy(data.pos);
    });

    // --- Elimination ---
    if (st.view === "match" && st.playerTokens <= 0 && !st.extraction) {
      st.eliminatePlayer();
      return;
    }

    // --- Extraction logic ---
    const distToExtract = playerPos.current.distanceTo(EXTRACT_POS);
    if (!st.extraction && st.activeWagerNpc === null && distToExtract < EXTRACT_RADIUS && st.playerTokens > 0) {
      // choose nearest npc as hunter
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
      st.startExtraction(hunter);
    }

    if (st.extraction && st.extraction.phase === "running") {
      st.tickExtraction(dt);
      const fresh = useGameStore.getState().extraction;
      const hunterPos = npcPos.current[fresh.hunterId]?.pos;
      if (hunterPos && hunterPos.distanceTo(playerPos.current) < CATCH_RADIUS) {
        st.triggerRoulette();
      } else if (fresh.timeLeft <= 0) {
        st.extractionEscape();
      }
    }

    // --- Proximity prompt (throttled) ---
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
      <OrthographicCamera
        ref={camRef}
        makeDefault
        position={[22, 24, 22]}
        zoom={26}
        near={0.1}
        far={200}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 5]} intensity={1.1} />
      <Ground onMove={(x, z) => playerTarget.current.set(clampBound(x), 0, clampBound(z))} />
      <Grid />
      <ExtractionZone />
      <Player groupRef={playerRef} />
      {npcs.map((n) => (
        <Npc
          key={n.id}
          npc={n}
          groupRef={(el) => (npcRefs.current[n.id] = el)}
        />
      ))}
    </>
  );
}

function ExtractionHud() {
  const extraction = useGameStore((s) => s.extraction);
  if (!extraction || extraction.phase !== "running") return null;
  const pct = (extraction.timeLeft / EXTRACTION_SECONDS) * 100;
  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-20 w-80 -translate-x-1/2 text-center">
      <div className="mb-1 text-xs uppercase tracking-[0.3em] text-danger glow">
        Extraction · Hunter Inbound
      </div>
      <div className="text-3xl font-bold text-white">{extraction.timeLeft.toFixed(1)}s</div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-danger transition-[width] duration-100" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function HudBar({ prompt }) {
  const playerTokens = useGameStore((s) => s.playerTokens);
  const log = useGameStore((s) => s.log);
  return (
    <>
      <div className="pointer-events-none absolute left-4 top-4 z-20">
        <div className="panel rounded-xl px-4 py-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Match Tokens</div>
          <div className="text-2xl font-bold text-neon glow">{playerTokens.toLocaleString()}</div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 w-72 space-y-1">
        {log.map((l) => (
          <div key={l.id} className="rounded bg-black/60 px-3 py-1 text-[11px] text-slate-300">
            {l.msg}
          </div>
        ))}
      </div>

      {prompt && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
          <div className="panel rounded-full px-5 py-2 text-sm text-white">
            {prompt === "wager" ? (
              <>
                Press <span className="font-bold text-gold">E</span> to challenge NPC
              </>
            ) : (
              <>
                Enter the <span className="font-bold text-emerald-400">Extraction Zone</span> to escape
              </>
            )}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute right-4 top-4 z-20 text-right text-[11px] text-slate-500">
        WASD / click to move · reach EXTRACT to bank tokens
      </div>
    </>
  );
}

export default function GameCanvas() {
  const [prompt, setPrompt] = useState("");
  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={["#06070c"]} />
        <fog attach="fog" args={["#06070c", 40, 90]} />
        <Scene setPrompt={setPrompt} />
      </Canvas>
      <HudBar prompt={prompt} />
      <ExtractionHud />
      <WagerOverlay />
      <RouletteOverlay />
    </div>
  );
}
