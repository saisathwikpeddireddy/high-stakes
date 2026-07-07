"use client";

import { forwardRef } from "react";
import { PALETTE } from "./constants";

// Presentational tuxedo croupier figure (no store coupling).
const Croupier = forwardRef(function Croupier({ hunter = false, glowRef }, ref) {
  const tuxColor = hunter ? "#4a0f10" : "#141013";
  const trimColor = hunter ? "#b91c1c" : PALETTE.gold;
  return (
    <group ref={ref}>
      {/* tux body (tapered) */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.62, 1.5, 20]} />
        <meshStandardMaterial color={tuxColor} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* white shirt front */}
      <mesh position={[0, 0.85, 0.34]}>
        <boxGeometry args={[0.26, 0.9, 0.12]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={0.6} />
      </mesh>
      {/* gold trim ring / cummerbund */}
      <mesh ref={glowRef} position={[0, 0.5, 0]}>
        <torusGeometry args={[0.5, 0.06, 10, 28]} />
        <meshStandardMaterial
          color={trimColor}
          emissive={trimColor}
          emissiveIntensity={hunter ? 1.4 : 0.3}
          metalness={1}
          roughness={0.3}
          toneMapped={!hunter}
        />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.32, 20, 20]} />
        <meshStandardMaterial color={hunter ? "#7f1d1d" : "#caa27a"} roughness={0.7} />
      </mesh>
      {/* bow tie */}
      <mesh position={[0, 1.42, 0.28]}>
        <boxGeometry args={[0.24, 0.08, 0.06]} />
        <meshStandardMaterial color={trimColor} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
});

export default Croupier;
