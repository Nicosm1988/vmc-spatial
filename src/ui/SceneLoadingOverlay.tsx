export default function SceneLoadingOverlay() {
  return (
    <div className="scene-loading" role="status" aria-live="polite">
      <div className="scene-loading__mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <strong>Preparando la experiencia espacial</strong>
      <small>Optimizando geometría, materiales e iluminación…</small>
    </div>
  )
}
