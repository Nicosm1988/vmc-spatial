export function supportsWebGL() {
  if (new URLSearchParams(window.location.search).has('fallback')) return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
