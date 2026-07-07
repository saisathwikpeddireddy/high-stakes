"use client";

import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

export default function Effects() {
  return (
    <EffectComposer multisampling={4} disableNormalPass>
      <Bloom
        intensity={0.9}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette eskil={false} offset={0.25} darkness={0.75} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.18} />
    </EffectComposer>
  );
}
