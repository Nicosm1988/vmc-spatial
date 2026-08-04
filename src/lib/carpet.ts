import * as THREE from 'three'
export function makeCarpet(
  base: [number, number, number] = [150, 158, 168],
  size = 512,
): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`
  g.fillRect(0, 0, size, size)
  const img = g.getImageData(0, 0, size, size),
    d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 40
    const red = d[i] ?? base[0]
    const green = d[i + 1] ?? base[1]
    const blue = d[i + 2] ?? base[2]
    d[i] = Math.max(0, Math.min(255, red + n))
    d[i + 1] = Math.max(0, Math.min(255, green + n))
    d[i + 2] = Math.max(0, Math.min(255, blue + n * 1.1))
  }
  g.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  return tex
}
