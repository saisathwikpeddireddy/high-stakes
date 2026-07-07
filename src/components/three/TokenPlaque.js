"use client";

import { Html } from "@react-three/drei";

// Gold-framed casino plaque floating above an entity.
export default function TokenPlaque({ value, accent = "#d4af37", height = 2.1 }) {
  return (
    <Html center distanceFactor={26} position={[0, height, 0]} zIndexRange={[10, 0]}>
      <div
        style={{
          borderColor: accent,
          color: accent,
          background: "linear-gradient(180deg, rgba(30,16,14,0.92), rgba(15,9,9,0.95))",
          boxShadow: `0 2px 10px rgba(0,0,0,0.6), inset 0 0 8px ${accent}22`,
        }}
        className="whitespace-nowrap rounded-md border px-2.5 py-0.5 text-[11px] font-semibold tabular"
      >
        {value.toLocaleString()}
      </div>
    </Html>
  );
}
