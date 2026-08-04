import { Bloom, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing'

export default function CinematicEffects({ night }: { night: boolean }) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={night ? 0.42 : 0.22}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.22} darkness={0.42} />
      <SMAA />
    </EffectComposer>
  )
}
