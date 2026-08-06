import {
  Bloom,
  EffectComposer,
  HueSaturation,
  SMAA,
  SSAO,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'

/**
 * Post-processing pipeline for the cinematic quality profile (F-038).
 * Uses WebGL via @react-three/postprocessing — no WebGPU dependency.
 *
 * Effects:
 * - SSAO: screen-space ambient occlusion for contact shadows and depth
 * - Bloom: subtle glow on emissive surfaces (screens, luminaires)
 * - Tone mapping: ACES Filmic for cinematic response curve
 * - Color grading: subtle warmth for architectural realism
 * - Vignette: gentle darkening at edges for cinematic framing
 * - SMAA: sub-pixel morphological anti-aliasing
 */
export default function CinematicEffects({ night }: { night: boolean }) {
  return (
    <EffectComposer multisampling={0}>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={21}
        radius={0.12}
        intensity={night ? 2.5 : 1.8}
        luminanceInfluence={0.4}
        bias={0.025}
        worldDistanceThreshold={30}
        worldDistanceFalloff={5}
        worldProximityThreshold={0.4}
        worldProximityFalloff={0.1}
      />
      <Bloom
        intensity={night ? 0.52 : 0.28}
        luminanceThreshold={night ? 0.72 : 0.82}
        luminanceSmoothing={0.15}
        mipmapBlur
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <HueSaturation
        blendFunction={BlendFunction.NORMAL}
        hue={0}
        saturation={night ? 0.05 : 0.08}
      />
      <Vignette eskil={false} offset={0.25} darkness={night ? 0.52 : 0.38} />
      <SMAA />
    </EffectComposer>
  )
}
