"use client";

import * as THREE from "three";
import { PALETTE } from "./constants";

function ChipStack({ position, color, count = 5 }) {
  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, 0.04 + i * 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.055, 20]} />
          <meshStandardMaterial color={i % 2 ? color : PALETTE.cream} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// Round green-felt wager table with walnut rim, gold trim, chip stacks + card fan.
export default function WagerTable({ position = [0, 0, 0] }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      {/* legs */}
      {[
        [0.7, 0.7],
        [-0.7, 0.7],
        [0.7, -0.7],
        [-0.7, -0.7],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], 0.45, p[1]]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.9, 10]} />
          <meshStandardMaterial color={PALETTE.walnut} roughness={0.6} />
        </mesh>
      ))}

      {/* walnut rim */}
      <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.18, 40]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.45} metalness={0.15} />
      </mesh>
      {/* gold trim ring */}
      <mesh position={[0, 1.02, 0]}>
        <torusGeometry args={[1.42, 0.05, 12, 48]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={1} roughness={0.25} />
      </mesh>
      {/* green felt top */}
      <mesh position={[0, 1.02, 0]} receiveShadow>
        <cylinderGeometry args={[1.32, 1.32, 0.04, 40]} />
        <meshStandardMaterial color={PALETTE.felt} roughness={0.95} />
      </mesh>

      {/* chip stacks */}
      <ChipStack position={[0.55, 1.04, 0.3]} color={PALETTE.red} count={5} />
      <ChipStack position={[-0.5, 1.04, -0.35]} color="#1e3a8a" count={4} />

      {/* card fan */}
      {[-0.2, 0, 0.2].map((r, i) => (
        <mesh
          key={i}
          position={[-0.4 + i * 0.12, 1.06, 0.5]}
          rotation={[-Math.PI / 2, 0, r]}
          castShadow
        >
          <boxGeometry args={[0.3, 0.42, 0.01]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
