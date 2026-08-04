import { CINEMATIC_PHASE_LABELS } from '../domain/cinematicAccess'
import type { CinematicTransitionPhase } from '../domain/cinematicAccess'
import { STAGE_LABELS } from '../domain/experience'
import { useExperienceStore } from '../state/useExperienceStore'

const PHASES: readonly CinematicTransitionPhase[] = ['flight', 'cover', 'handoff', 'reveal']

function toPercent(progress: number | undefined) {
  if (progress === undefined || !Number.isFinite(progress)) return 0
  const normalized = progress > 1 ? progress / 100 : progress
  return Math.round(Math.min(1, Math.max(0, normalized)) * 100)
}

function TransitionProgress() {
  const progress = useExperienceStore((state) => state.transition?.progress)
  const phase = useExperienceStore((state) => state.transition?.phase)
  const percent = toPercent(progress)

  return (
    <div className="transition-status__progress">
      <progress
        max="100"
        value={percent}
        aria-label={`Progreso: ${phase === undefined ? 'recorrido' : CINEMATIC_PHASE_LABELS[phase]}`}
        aria-valuetext={`${percent}%`}
      >
        {percent}%
      </progress>
      <span aria-hidden="true">{percent.toString().padStart(2, '0')}%</span>
    </div>
  )
}

function PhaseRail({ phase }: { phase: CinematicTransitionPhase }) {
  const activeIndex = PHASES.indexOf(phase)

  return (
    <ol className="transition-status__phases" aria-label="Etapas del recorrido">
      {PHASES.map((item, index) => (
        <li
          key={item}
          className={index <= activeIndex ? 'is-reached' : ''}
          aria-current={item === phase ? 'step' : undefined}
        >
          <span aria-hidden="true" />
          <small>{CINEMATIC_PHASE_LABELS[item]}</small>
        </li>
      ))}
    </ol>
  )
}

function TransitionChrome() {
  const phase = useExperienceStore((state) => state.transition?.phase)
  const target = useExperienceStore((state) => state.transition?.to)
  const cancel = useExperienceStore((state) => state.cancelTransition)

  if (phase === undefined || target === undefined) return null

  const phaseLabel = CINEMATIC_PHASE_LABELS[phase]

  return (
    <>
      <div className={`cinematic-frame cinematic-frame--${phase}`} aria-hidden="true">
        <span className="cinematic-frame__bar cinematic-frame__bar--top" />
        <span className="cinematic-frame__vignette" />
        <span className="cinematic-frame__bar cinematic-frame__bar--bottom" />
      </div>

      <section
        className="transition-status"
        aria-label="Estado del recorrido cinematográfico"
        data-phase={phase}
      >
        <div className="transition-status__heading">
          <span className="transition-status__demo">DEMO / NO VERIFICADO</span>
          <span className="transition-status__sequence" aria-hidden="true">
            Secuencia 16
          </span>
        </div>

        <div className="transition-status__copy">
          <div>
            <span className="transition-status__kicker">Acceso cinematográfico</span>
            <strong>{phaseLabel}</strong>
            <small>Destino · {STAGE_LABELS[target]}</small>
          </div>
          <button
            type="button"
            className="transition-status__cancel"
            onClick={cancel}
            aria-keyshortcuts="Escape"
            title="Cancelar recorrido (Esc)"
          >
            Cancelar recorrido <kbd aria-hidden="true">Esc</kbd>
          </button>
        </div>

        <PhaseRail phase={phase} />
        <TransitionProgress />
      </section>

      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {phaseLabel}. Destino: {STAGE_LABELS[target]}.
      </span>
    </>
  )
}

export default function TransitionStatus() {
  const transitionId = useExperienceStore((state) => state.transition?.id)

  if (transitionId === undefined) return null

  return <TransitionChrome />
}
