import { STAGE_LABELS } from '../domain/experience'
import { useExperienceStore } from '../state/useExperienceStore'

export default function ExperienceNav({ ensure3D }: { ensure3D: () => void }) {
  const stage = useExperienceStore((state) => state.stage)
  const goExterior = useExperienceStore((state) => state.goExterior)
  const goToFloor16 = useExperienceStore((state) => state.goToFloor16)
  const enterInterior = useExperienceStore((state) => state.enterInterior)

  function run(action: () => void) {
    ensure3D()
    action()
  }

  return (
    <nav className="experience-nav" aria-label="Recorrido 3D">
      <div className="experience-nav__eyebrow">Recorrido</div>
      <div className="experience-nav__status" data-testid="scene-stage">
        <span className="status-pulse" />
        {STAGE_LABELS[stage]}
      </div>
      <div className="experience-nav__actions">
        <button className={stage === 'exterior' ? 'active' : ''} onClick={() => run(goExterior)}>
          <span>01</span> Exterior
        </button>
        <button
          className={stage === 'approach16' || stage === 'floor16' ? 'active' : ''}
          onClick={() => run(goToFloor16)}
          disabled={stage === 'approach16'}
        >
          <span>02</span> Ir al piso 16
        </button>
        <button className={stage === 'interior' ? 'active' : ''} onClick={() => run(enterInterior)}>
          <span>03</span> Entrar a la sala
        </button>
      </div>
    </nav>
  )
}
