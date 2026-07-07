"use client";

import { Environment, SoftShadows, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PALETTE } from "./constants";

function Chandelier({ position }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      // gentle flicker
      const f = 0.9 + Math.sin(state.clock.elapsedTime * 3 + position[0]) * 0.06;
      ref.current.intensity = 30 * f;
    }
  });
  return (
    <group position={position}>
      {/* emissive crystal cluster */}
      {[
        [0, 0, 0],
        [0.5, -0.3, 0.3],
        [-0.5, -0.3, -0.3],
        [0.4, -0.3, -0.4],
        [-0.4, -0.3, 0.4],
      ].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial
            color={PALETTE.warmLight}
            emissive={PALETTE.goldLight}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      ))}
      <pointLight ref={ref} color={PALETTE.warmLight} intensity={30} distance={30} decay={1.6} />
      <Sparkles count={14} scale={2.2} size={3} speed={0.2} color={PALETTE.goldLight} />
    </group>
  );
}

export default function Lighting() {
  return (
    <>
      <SoftShadows size={26} samples={12} focus={0.9} />
      <Environment preset="lobby" environmentIntensity={0.45} />

      <hemisphereLight args={[PALETTE.warmLight, PALETTE.walnut, 0.4]} />

      {/* Key spotlight — grounds shadows */}
      <spotLight
        position={[6, 26, 10]}
        angle={0.7}
        penumbra={0.8}
        intensity={140}
        distance={90}
        color={PALETTE.warmLight}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />

      {/* Warm fill from the opposite side */}
      <pointLight position={[-16, 12, -14]} color="#ffcf9e" intensity={30} distance={50} decay={1.5} />

      <Chandelier position={[-8, 13, -8]} />
      <Chandelier position={[9, 13, 6]} />
      <Chandelier position={[0, 14, 12]} />
    </>
  );
}
