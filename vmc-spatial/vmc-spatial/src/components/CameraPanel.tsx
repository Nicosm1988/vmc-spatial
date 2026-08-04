import type { CamApi } from './Scene3D'
export default function CameraPanel({ camApi }: { camApi: React.MutableRefObject<CamApi> }) {
  const c = () => camApi.current
  return (
    <div className="campanel">
      <div className="cp-title">🎥 Cámara</div>
      <div className="cp-grid">
        <button title="Acercar" onClick={() => c().zoom?.(0.8)}>➕</button>
        <button title="Alejar" onClick={() => c().zoom?.(1.25)}>➖</button>
        <button title="Girar izq" onClick={() => c().orbit?.(-20)}>⟲</button>
        <button title="Girar der" onClick={() => c().orbit?.(20)}>⟳</button>
        <button title="Inclinar arriba" onClick={() => c().tilt?.(12)}>⬆️</button>
        <button title="Inclinar abajo" onClick={() => c().tilt?.(-12)}>⬇️</button>
      </div>
      <div className="cp-row"><button className="cp-wide" onClick={() => c().enter?.()}>🚪 Entrar a la sala</button></div>
      <div className="cp-row"><button onClick={() => c().top?.()}>🗺️ Cenital</button><button onClick={() => c().reset?.()}>↺ Reset</button></div>
      <div className="cp-hint">Mouse: izq=girar · der=mover · rueda=zoom al cursor</div>
    </div>
  )
}
