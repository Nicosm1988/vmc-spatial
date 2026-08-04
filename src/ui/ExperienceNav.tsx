import { STAGE_LABELS } from '../domain/experience'
import { useExperienceStore } from '../state/useExperienceStore'

type NavigationTarget = 'exterior' | 'floor16' | 'interior'

export default function ExperienceNav({ ensure3D }: { ensure3D: () => void }) {
  const stage = useExperienceStore((state) => state.stage)
  const activeStage = useExperienceStore((state) => state.transition?.to ?? state.stage)
  const goExterior = useExperienceStore((state) => state.goExterior)
  const goToFloor16 = useExperienceStore((state) => state.goToFloor16)
  const enterInterior = useExperienceStore((state) => state.enterInterior)

  function run(target: NavigationTarget, action: () => void) {
    ensure3D()

    const current = useExperienceStore.getState()
    if (
      current.transition?.to === target ||
      (current.transition === null && current.stage === target)
    ) {
      return
    }

    action()
  }

  return (
    <nav className="experience-nav" aria-label="Recorrido 3D">
      <div className="experience-nav__eyebrow">Recorrido</div>
      <div className="experience-nav__status" data-testid="scene-stage">
        <span className="status-pulse" aria-hidden="true" />
        {STAGE_LABELS[stage]}
      </div>
      <div className="experience-nav__actions">
        <button
          type="button"
          className={activeStage === 'exterior' ? 'active' : ''}
          aria-current={activeStage === 'exterior' ? 'step' : undefined}
          onClick={() => run('exterior', goExterior)}
        >
          <span aria-hidden="true">01</span> Exterior
        </button>
        <button
          type="button"
          className={activeStage === 'floor16' ? 'active' : ''}
          aria-current={activeStage === 'floor16' ? 'step' : undefined}
          onClick={() => run('floor16', goToFloor16)}
        >
          <span aria-hidden="true">02</span> Ir al piso 16
        </button>
        <button
          type="button"
          className={activeStage === 'interior' ? 'active' : ''}
          aria-current={activeStage === 'interior' ? 'step' : undefined}
          onClick={() => run('interior', enterInterior)}
        >
          <span aria-hidden="true">03</span> Entrar a la sala
        </button>
      </div>
    </nav>
  )
}
