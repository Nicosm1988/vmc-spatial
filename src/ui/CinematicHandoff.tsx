import { useExperienceStore } from '../state/useExperienceStore'

const HANDOFF_PHASES = new Set(['cover', 'handoff', 'reveal'])

export default function CinematicHandoff() {
  const phase = useExperienceStore((state) => state.transition?.phase)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)

  if (phase === undefined || !HANDOFF_PHASES.has(phase)) return null

  return (
    <div
      className={`cinematic-handoff cinematic-handoff--${phase}${reducedMotion ? ' cinematic-handoff--reduced-motion' : ''}`}
      data-testid="cinematic-handoff"
      data-phase={phase}
      aria-hidden="true"
    >
      <span className="cinematic-handoff__veil" />
      <span className="cinematic-handoff__aperture" />
      <span className="cinematic-handoff__mark">
        <i />
        <i />
      </span>
    </div>
  )
}
