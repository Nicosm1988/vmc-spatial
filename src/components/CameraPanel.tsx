import type { CamApiRef } from '../scene/cameraTypes'
import { useExperienceStore } from '../state/useExperienceStore'

export default function CameraPanel({ camApi }: { camApi: CamApiRef }) {
  const camera = () => camApi.current
  const transitioning = useExperienceStore((state) => state.transition !== null)

  return (
    <div className="campanel">
      <div className="cp-title">
        <span>Navegación espacial</span>
        <small>Doble clic · WASD</small>
      </div>
      <div className="cp-grid">
        <button
          disabled={transitioning}
          title="Acercar"
          aria-label="Acercar"
          onClick={() => camera().zoom?.(0.8)}
        >
          +
        </button>
        <button
          disabled={transitioning}
          title="Alejar"
          aria-label="Alejar"
          onClick={() => camera().zoom?.(1.25)}
        >
          −
        </button>
        <button
          disabled={transitioning}
          title="Girar a la izquierda"
          onClick={() => camera().orbit?.(-20)}
        >
          ↶
        </button>
        <button
          disabled={transitioning}
          title="Girar a la derecha"
          onClick={() => camera().orbit?.(20)}
        >
          ↷
        </button>
        <button
          disabled={transitioning}
          title="Avanzar"
          aria-label="Avanzar"
          onClick={() => camera().stepForward?.()}
        >
          ↑
        </button>
        <button
          title="Retroceder"
          aria-label="Retroceder"
          disabled={transitioning}
          onClick={() => camera().stepBackward?.()}
        >
          ↓
        </button>
        <button
          title="Mover a la izquierda"
          aria-label="Mover a la izquierda"
          disabled={transitioning}
          onClick={() => camera().strafe?.(-1)}
        >
          ←
        </button>
        <button
          title="Mover a la derecha"
          aria-label="Mover a la derecha"
          disabled={transitioning}
          onClick={() => camera().strafe?.(1)}
        >
          →
        </button>
      </div>
      <div className="cp-row">
        <button disabled={transitioning} onClick={() => camera().top?.()}>
          Cenital
        </button>
        <button disabled={transitioning} onClick={() => camera().reset?.()}>
          Reset
        </button>
      </div>
      <p className="cp-help">
        Arrastrá para desplazarte · botón derecho para orbitar · Shift + doble clic para volver.
      </p>
      <button disabled={transitioning} className="cp-wide" onClick={() => camera().capture?.()}>
        Capturar escena
      </button>
    </div>
  )
}
