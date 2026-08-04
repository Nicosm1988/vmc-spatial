import type { CamApiRef } from '../scene/cameraTypes'

export default function CameraPanel({ camApi }: { camApi: CamApiRef }) {
  const camera = () => camApi.current

  return (
    <div className="campanel">
      <div className="cp-title">
        <span>Cámara interior</span>
        <small>Mouse / touch</small>
      </div>
      <div className="cp-grid">
        <button title="Acercar" aria-label="Acercar" onClick={() => camera().zoom?.(0.8)}>
          +
        </button>
        <button title="Alejar" aria-label="Alejar" onClick={() => camera().zoom?.(1.25)}>
          −
        </button>
        <button title="Girar a la izquierda" onClick={() => camera().orbit?.(-20)}>
          ↶
        </button>
        <button title="Girar a la derecha" onClick={() => camera().orbit?.(20)}>
          ↷
        </button>
        <button title="Inclinar arriba" onClick={() => camera().tilt?.(12)}>
          ↑
        </button>
        <button title="Inclinar abajo" onClick={() => camera().tilt?.(-12)}>
          ↓
        </button>
      </div>
      <div className="cp-row">
        <button onClick={() => camera().top?.()}>Cenital</button>
        <button onClick={() => camera().reset?.()}>Reset</button>
      </div>
      <button className="cp-wide" onClick={() => camera().capture?.()}>
        Capturar escena
      </button>
    </div>
  )
}
