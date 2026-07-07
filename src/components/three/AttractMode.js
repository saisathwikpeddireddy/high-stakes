"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Croupier from "./Croupier";
import { TABLE_POSITIONS } from "./constants";

function IdleCroupier({ position }) {
  const inner = useRef();
  useFrame((state) => {
    if (inner.current) inner.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.03;
  });
  return (
    <group position={[position[0], 0, position[1]]}>
      <Croupier ref={inner} />
    </group>
  );
}

// Slow cinematic camera orbit over the luxe floor while the Hub menu is shown.
export default function AttractMode() {
  const camRef = useRef();

  useFrame((state) => {
    if (!camRef.current) return;
    const t = state.clock.elapsedTime * 0.06;
    const r = 30;
    camRef.current.position.set(Math.sin(t) * r, 20 + Math.sin(t * 0.7) * 3, Math.cos(t) * r);
    camRef.current.lookAt(0, 1.5, 0);
  });

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault fov={32} near={0.1} far={300} position={[0, 20, 30]} />
      {TABLE_POSITIONS.map((p, i) => (
        <IdleCroupier key={i} position={[p[0] + 2.2, p[1]]} />
      ))}
    </>
  );
}
