import * as THREE from "three";

export const BOUND = 18;
export const WAGER_RADIUS = 3.2;
export const EXTRACT_RADIUS = 4;
export const CATCH_RADIUS = 1.6;
export const EXTRACT_POS = new THREE.Vector3(BOUND - 3, 0, BOUND - 3);

// Fixed table stations (a subset of NPCs read as seated at these).
export const TABLE_POSITIONS = [
  [-9, -6],
  [8, -8],
  [-7, 8],
  [3, 6],
];

export const PALETTE = {
  bg: "#160d0d",
  gold: "#d4af37",
  goldLight: "#f5d67b",
  red: "#7f1d1d",
  felt: "#0f5132",
  cream: "#e8e2d0",
  walnut: "#3b2416",
  warmLight: "#fff2d6",
};

export function clampBound(v) {
  return Math.max(-BOUND, Math.min(BOUND, v));
}
