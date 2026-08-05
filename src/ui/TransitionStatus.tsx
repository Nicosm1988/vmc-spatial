import { STAGE_LABELS } from '../domain/experience'
import { useExperienceStore } from '../state/useExperienceStore'

function toPercent(progress: number | undefined) {
  if (progress === undefined || !Number.isFinite(progress)) return 0
  const normalized = progress > 1 ? progress / 100 : progress
  return Math.round(Math.min(1, Math.max(0, normalized)) * 100)
}

function ContinuousTransition() {
  const target = useExperienceStore((state) => state.transition?.to)
  const progress = useExperienceStore((state) => state.transition?.progress)
  const cancel = useExperienceStore((state) => state.cancelTransition)

  if (target === undefined) return null

  const percent = toPercent(progress)
  const destination = STAGE_LABELS[target]

  return (
    <>
      <div className="cinematic-frame" aria-hidden="true">
        <span className="cinematic-frame__bar cinematic-frame__bar--top" />
        <span className="cinematic-frame__vignette" />
        <span className="cinematic-frame__bar cinematic-frame__bar--bottom" />
      </div>

      <section
        className="transition-status"
        aria-label="Estado del recorrido cinematográfico"
        data-transition-style="continuous"
      >
        <div className="transition-status__copy">
          <div>
            <span className="transition-status__kicker">Plano secuencia</span>
            <strong>Hacia {destination}</strong>
          </div>
          <button
            type="button"
            className="transition-status__cancel"
            onClick={cancel}
            aria-keyshortcuts="Escape"
            title="Cancelar recorrido (Esc)"
          >
            Salir <kbd aria-hidden="true">Esc</kbd>
          </button>
        </div>

        <div className="transition-status__progress">
          <progress
            max="100"
            value={percent}
            aria-label="Avance del plano secuencia"
            aria-valuetext={`${percent}%`}
          >
            {percent}%
          </progress>
          <span aria-hidden="true">{percent.toString().padStart(2, '0')}%</span>
        </div>
      </section>

      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Recorrido continuo hacia {destination}.
      </span>
    </>
  )
}

export default function TransitionStatus() {
  const transitionId = useExperienceStore((state) => state.transition?.id)

  if (transitionId === undefined) return null

  return <ContinuousTransition />
}
