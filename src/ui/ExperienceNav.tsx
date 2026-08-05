import { STAGE_LABELS } from '../domain/experience'
import { useExperienceStore } from '../state/useExperienceStore'

type NavigationTarget = 'exterior' | 'floor16' | 'interior'

export default function ExperienceNav({
  ensure3D,
  reframe,
}: {
  ensure3D: () => void
  reframe: (target: NavigationTarget) => void
}) {
  const stage = useExperienceStore((state) => state.stage)
  const transition = useExperienceStore((state) => state.transition)
  const activeStage = transition?.to ?? stage
  const goExterior = useExperienceStore((state) => state.goExterior)
  const goToFloor16 = useExperienceStore((state) => state.goToFloor16)
  const enterInterior = useExperienceStore((state) => state.enterInterior)

  function run(target: NavigationTarget, action: () => void) {
    ensure3D()

    const current = useExperienceStore.getState()
    if (current.transition?.to === target) return
    if (current.transition === null && current.stage === target) {
      reframe(target)
      return
    }

    action()
  }

  return (
    <nav
      className="experience-nav experience-nav--compact experience-nav--persistent"
      aria-label="Recorrido 3D"
    >
      <div className="experience-nav__eyebrow">Recorrido</div>
      <div className="experience-nav__status" data-testid="scene-stage">
        <span className="status-pulse" aria-hidden="true" />
        {STAGE_LABELS[stage]}
      </div>
      <div className="experience-nav__actions">
        <button
          type="button"
          className={activeStage === 'exterior' ? 'active' : ''}
          aria-label="Volver a la torre completa"
          aria-current={activeStage === 'exterior' ? 'step' : undefined}
          disabled={transition !== null}
          onClick={() => run('exterior', goExterior)}
        >
          <span aria-hidden="true">01</span> Torre completa
        </button>
        <button
          type="button"
          className={activeStage === 'floor16' ? 'active' : ''}
          aria-label="Ir al piso 16"
          aria-current={activeStage === 'floor16' ? 'step' : undefined}
          disabled={transition !== null}
          onClick={() => run('floor16', goToFloor16)}
        >
          <span aria-hidden="true">02</span> Piso 16
        </button>
        <button
          type="button"
          className={activeStage === 'interior' ? 'active' : ''}
          aria-label="Entrar a la sala"
          aria-current={activeStage === 'interior' ? 'step' : undefined}
          disabled={transition !== null}
          onClick={() => run('interior', enterInterior)}
        >
          <span aria-hidden="true">03</span> Sala
        </button>
      </div>
    </nav>
  )
}
