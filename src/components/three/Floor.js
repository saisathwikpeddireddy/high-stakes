"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { BOUND, PALETTE } from "./constants";

const SIZE = BOUND * 2 + 8;

export default function Floor({ onMove }) {
  return (
    <group>
      {/* Polished marble reflector floor — carries the raycast for click-to-move */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          onMove(e.point.x, e.point.z);
        }}
      >
        <planeGeometry args={[SIZE, SIZE]} />
        <MeshReflectorMaterial
          resolution={1024}
          mixBlur={1}
          mixStrength={2.2}
          blur={[400, 120]}
          roughness={0.5}
          depthScale={0.6}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.2}
          color="#241514"
          metalness={0.6}
        />
      </mesh>

      {/* Deep-red carpet border ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[BOUND - 0.5, BOUND + 2, 80]} />
        <meshStandardMaterial color={PALETTE.red} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Inlaid gold medallion rings at center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[5.4, 6, 96]} />
        <meshStandardMaterial
          color={PALETTE.gold}
          emissive={PALETTE.gold}
          emissiveIntensity={0.25}
          metalness={1}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[6.6, 6.85, 96]} />
        <meshStandardMaterial
          color={PALETTE.goldLight}
          emissive={PALETTE.gold}
          emissiveIntensity={0.3}
          metalness={1}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Walnut base skirt below carpet to hide plane edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[BOUND + 2, BOUND + 6, 80]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
