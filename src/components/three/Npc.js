"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore";
import Croupier from "./Croupier";
import TokenPlaque from "./TokenPlaque";
import { PALETTE } from "./constants";

// Store-driven NPC. Neutral = black tux + gold; Hunter = crimson + pulsing red.
export default function Npc({ npc, groupRef }) {
  const liveNpc = useGameStore((s) => s.npcs.find((n) => n.id === npc.id));
  const isHunter = liveNpc?.state === "hunter";
  const tokens = liveNpc?.tokens ?? npc.tokens;
  const inner = useRef();
  const glow = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime + npc.id;
    if (inner.current) {
      inner.current.rotation.z = Math.sin(t * 1.5) * (isHunter ? 0.06 : 0.03);
      inner.current.rotation.x = isHunter ? 0.12 : Math.sin(t * 1.1) * 0.02;
    }
    if (glow.current && isHunter) {
      glow.current.material.emissiveIntensity = 1.2 + Math.sin(t * 8) * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      <Croupier ref={inner} hunter={isHunter} glowRef={glow} />
      {isHunter && <pointLight position={[0, 1.2, 0]} color="#ef4444" intensity={5} distance={7} decay={1.6} />}
      <TokenPlaque value={tokens} accent={isHunter ? "#f87171" : PALETTE.goldLight} height={2.4} />
    </group>
  );
}
