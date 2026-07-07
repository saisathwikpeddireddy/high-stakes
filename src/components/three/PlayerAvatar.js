"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";
import TokenPlaque from "./TokenPlaque";
import { PALETTE } from "./constants";

// Faceted obsidian + gold high-roller gem. Outer group position is driven by Scene.
export default function PlayerAvatar({ groupRef }) {
  const tokens = useGameStore((s) => s.playerTokens);
  const inner = useRef();
  const prev = useRef(new THREE.Vector3());
  const vel = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    if (!groupRef.current || !inner.current) return;
    const p = groupRef.current.position;
    // travel velocity for banking tilt
    vel.current.set(p.x - prev.current.x, 0, p.z - prev.current.z);
    prev.current.copy(p);

    const t = state.clock.elapsedTime;
    inner.current.position.y = 1 + Math.sin(t * 2) * 0.12; // idle bob
    inner.current.rotation.y += dt * 0.8;

    // bank toward travel direction
    const bankX = THREE.MathUtils.clamp(vel.current.z * 12, -0.35, 0.35);
    const bankZ = THREE.MathUtils.clamp(-vel.current.x * 12, -0.35, 0.35);
    inner.current.rotation.x = THREE.MathUtils.lerp(inner.current.rotation.x, bankX, 0.1);
    inner.current.rotation.z = THREE.MathUtils.lerp(inner.current.rotation.z, bankZ, 0.1);
  });

  return (
    <group ref={groupRef}>
      <group ref={inner} position={[0, 1, 0]}>
        {/* obsidian gem body */}
        <mesh castShadow>
          <octahedronGeometry args={[0.85, 0]} />
          <meshStandardMaterial
            color="#1a1210"
            metalness={0.9}
            roughness={0.15}
            emissive={PALETTE.gold}
            emissiveIntensity={0.15}
          />
        </mesh>
        {/* gold core glow */}
        <mesh scale={0.42}>
          <octahedronGeometry args={[0.85, 0]} />
          <meshStandardMaterial
            color={PALETTE.goldLight}
            emissive={PALETTE.goldLight}
            emissiveIntensity={2.5}
            toneMapped={false}
          />
        </mesh>
        {/* gold equatorial ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.06, 10, 32]} />
          <meshStandardMaterial color={PALETTE.gold} metalness={1} roughness={0.25} />
        </mesh>
        <Sparkles count={12} scale={1.6} size={2.5} speed={0.3} color={PALETTE.goldLight} />
      </group>
      <pointLight position={[0, 1.4, 0]} color={PALETTE.goldLight} intensity={6} distance={6} decay={1.5} />
      <TokenPlaque value={tokens} accent={PALETTE.goldLight} />
    </group>
  );
}
