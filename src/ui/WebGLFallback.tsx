export default function WebGLFallback({ openPlan }: { openPlan: () => void }) {
  return (
    <section className="webgl-fallback" role="alert">
      <span className="webgl-fallback__icon" aria-hidden="true">
        2D
      </span>
      <p className="eyebrow">Modo compatible</p>
      <h2>Tu dispositivo no pudo iniciar la escena 3D</h2>
      <p>
        El plano editable sigue disponible. Podés continuar trabajando sin perder la configuración.
      </p>
      <button className="primary-action" onClick={openPlan}>
        Abrir plano 2D
      </button>
    </section>
  )
}
