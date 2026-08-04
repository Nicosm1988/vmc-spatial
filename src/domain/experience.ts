export type StableSceneStage = 'exterior' | 'floor16' | 'interior'

/**
 * Compatibility alias for consumers that used SceneStage before cinematic
 * navigation became an explicit transition state machine.
 */
export type SceneStage = StableSceneStage

/** The render tree mounted while a stable stage or transition is active. */
export type ActiveScene = 'exterior' | 'interior'

export type QualityPreference = 'auto' | 'performance' | 'balanced' | 'cinematic'
export type ResolvedQuality = Exclude<QualityPreference, 'auto'>

export const STAGE_LABELS: Record<SceneStage, string> = {
  exterior: 'Exterior · Puerto Madero',
  floor16: 'Fachada · Piso 16',
  interior: 'Sala demostrativa · Piso 16',
}

export const TRANSITION_LABELS: Record<SceneStage, string> = {
  exterior: 'Regresando a la vista exterior',
  floor16: 'Llegamos al piso 16',
  interior: 'Ingresando a la sala',
}

export function getActiveScene(stage: StableSceneStage): ActiveScene {
  return stage === 'interior' ? 'interior' : 'exterior'
}
