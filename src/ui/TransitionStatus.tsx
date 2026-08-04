import { TRANSITION_LABELS } from '../domain/experience'
import { useExperienceStore } from '../state/useExperienceStore'

export default function TransitionStatus() {
  const stage = useExperienceStore((state) => state.stage)
  const transitioning = useExperienceStore((state) => state.transitioning)
  const cancel = useExperienceStore((state) => state.cancelTransition)

  if (!transitioning) return null

  return (
    <div className="transition-status" role="status" aria-live="polite">
      <span className="transition-status__line" />
      <span>{TRANSITION_LABELS[stage]}</span>
      <button onClick={cancel}>Cancelar</button>
    </div>
  )
}
