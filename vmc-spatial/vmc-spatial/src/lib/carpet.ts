import * as THREE from 'three'
// Genera una textura de alfombra procedural (gris moteado tipo loop pile).
export function makeCarpet(base: [number, number, number] = [150, 158, 168], size = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; g.fillRect(0, 0, size, size)
  // ruido fino
  const img = g.getImageData(0, 0, size, size), d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 46
    d[i] = Math.max(0, Math.min(255, d[i] + n))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 1.1))
  }
  g.putImageData(img, 0, 0)
  // baldosas sutiles (líneas tenues)
  g.strokeStyle = 'rgba(0,0,0,0.06)'; g.lineWidth = 1
  const tile = size / 4
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * tile, 0); g.lineTo(i * tile, size); g.stroke(); g.beginPath(); g.moveTo(0, i * tile); g.lineTo(size, i * tile); g.stroke() }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}
