"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";
import { EXTRACT_POS, EXTRACT_RADIUS, PALETTE } from "./constants";

// Gold cashier's cage / VIP vault. Turns red-alarm when the hunter is inbound.
export default function ExtractionVault() {
  const ring1 = useRef();
  const ring2 = useRef();
  const beam = useRef();
  const extraction = useGameStore((s) => s.extraction);
  const alarm = !!extraction && extraction.phase === "running";

  const accent = alarm ? "#ef4444" : PALETTE.gold;
  const emissive = alarm ? "#b91c1c" : PALETTE.goldLight;

  useFrame((state, dt) => {
    if (ring1.current) ring1.current.rotation.y += dt * 0.7;
    if (ring2.current) ring2.current.rotation.y -= dt * 1.1;
    if (beam.current) {
      const pulse = 0.28 + Math.sin(state.clock.elapsedTime * (alarm ? 8 : 2)) * 0.08;
      beam.current.material.opacity = pulse;
    }
  });

  return (
    <group position={[EXTRACT_POS.x, 0, EXTRACT_POS.z]}>
      {/* floor cage disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[EXTRACT_RADIUS - 0.5, EXTRACT_RADIUS, 64]} />
        <meshStandardMaterial
          color={accent}
          emissive={emissive}
          emissiveIntensity={alarm ? 1.2 : 0.5}
          metalness={1}
          roughness={0.3}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[EXTRACT_RADIUS - 0.5, 48]} />
        <meshStandardMaterial color="#241514" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* updraft light beam */}
      <mesh ref={beam} position={[0, 4, 0]}>
        <cylinderGeometry args={[EXTRACT_RADIUS - 1, 0.4, 8, 32, 1, true]} />
        <meshBasicMaterial
          color={emissive}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* rotating gold rings */}
      <mesh ref={ring1} position={[0, 1.3, 0]}>
        <torusGeometry args={[1.1, 0.09, 12, 40]} />
        <meshStandardMaterial color={accent} emissive={emissive} emissiveIntensity={0.9} metalness={1} roughness={0.25} toneMapped={false} />
      </mesh>
      <mesh ref={ring2} position={[0, 2.0, 0]} rotation={[0.4, 0, 0.3]}>
        <torusGeometry args={[0.75, 0.07, 12, 40]} />
        <meshStandardMaterial color={accent} emissive={emissive} emissiveIntensity={0.9} metalness={1} roughness={0.25} toneMapped={false} />
      </mesh>

      {/* corner posts with velvet rope feel */}
      {[
        [EXTRACT_RADIUS - 0.6, EXTRACT_RADIUS - 0.6],
        [-(EXTRACT_RADIUS - 0.6), EXTRACT_RADIUS - 0.6],
        [EXTRACT_RADIUS - 0.6, -(EXTRACT_RADIUS - 0.6)],
        [-(EXTRACT_RADIUS - 0.6), -(EXTRACT_RADIUS - 0.6)],
      ].map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 1.1, 12]} />
            <meshStandardMaterial color={PALETTE.gold} metalness={1} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color={PALETTE.goldLight} metalness={1} roughness={0.2} emissive={PALETTE.gold} emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}

      <spotLight
        position={[0, 9, 0]}
        angle={0.5}
        penumbra={0.7}
        intensity={alarm ? 120 : 70}
        distance={20}
        color={emissive}
        target-position={[EXTRACT_POS.x, 0, EXTRACT_POS.z]}
      />
      <Sparkles count={26} scale={[EXTRACT_RADIUS, 5, EXTRACT_RADIUS]} size={3} speed={0.4} color={emissive} />

      <Text position={[0, 3.4, 0]} fontSize={0.62} color={accent} anchorX="center" outlineWidth={0.012} outlineColor="#160d0d">
        {alarm ? "EXTRACTING" : "CASHIER"}
      </Text>
    </group>
  );
}
