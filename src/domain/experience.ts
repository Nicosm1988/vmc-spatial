export type SceneStage = 'exterior' | 'approach16' | 'floor16' | 'interior'

export type QualityPreference = 'auto' | 'performance' | 'balanced' | 'cinematic'
export type ResolvedQuality = Exclude<QualityPreference, 'auto'>

export const STAGE_LABELS: Record<SceneStage, string> = {
  exterior: 'Exterior · Puerto Madero',
  approach16: 'Vuelo al piso 16',
  floor16: 'Fachada · Piso 16',
  interior: 'Sala demostrativa · Piso 16',
}

export const TRANSITION_LABELS: Record<SceneStage, string> = {
  exterior: 'Regresando a la vista exterior',
  approach16: 'Acercándonos al piso 16',
  floor16: 'Llegamos al piso 16',
  interior: 'Ingresando a la sala',
}
