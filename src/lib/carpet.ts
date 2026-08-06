import * as THREE from 'three'

/**
 * Procedural carpet tile texture calibrated from restricted evidence (F-037).
 * Generates a modular carpet tile pattern with cross-hatched fiber structure,
 * matching the commercial office carpet tiles observed in the reference photos.
 * No photograph is loaded or used as a texture.
 */
export function makeCarpet(
  base: [number, number, number] = [138, 133, 126],
  size = 512,
): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`
  g.fillRect(0, 0, size, size)
  const img = g.getImageData(0, 0, size, size),
    d = img.data
  let seed = 0x7f4a7c15
  const noise = () => {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0
    return seed / 4_294_967_296
  }

  // Base noise layer — fine fiber variation
  for (let i = 0; i < d.length; i += 4) {
    const n = (noise() - 0.5) * 32
    const red = d[i] ?? base[0]
    const green = d[i + 1] ?? base[1]
    const blue = d[i + 2] ?? base[2]
    d[i] = Math.max(0, Math.min(255, red + n))
    d[i + 1] = Math.max(0, Math.min(255, green + n * 0.95))
    d[i + 2] = Math.max(0, Math.min(255, blue + n * 0.9))
  }

  // Add cross-hatch texture pattern (modular tile effect)
  const tileSize = size / 8
  for (let ty = 0; ty < 8; ty += 1) {
    for (let tx = 0; tx < 8; tx += 1) {
      const isAlternate = (tx + ty) % 2 === 0
      const startX = Math.floor(tx * tileSize)
      const startY = Math.floor(ty * tileSize)
      const endX = Math.floor(startX + tileSize)
      const endY = Math.floor(startY + tileSize)
      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const i = (y * size + x) * 4
          const localX = x - startX
          const localY = y - startY
          // Create subtle directional fiber pattern per tile
          const fiberNoise = isAlternate
            ? Math.sin(localX * 0.8) * 4 + Math.sin(localY * 3.2) * 2
            : Math.sin(localY * 0.8) * 4 + Math.sin(localX * 3.2) * 2
          d[i] = Math.max(0, Math.min(255, (d[i] ?? 0) + fiberNoise))
          d[i + 1] = Math.max(0, Math.min(255, (d[i + 1] ?? 0) + fiberNoise * 0.95))
          d[i + 2] = Math.max(0, Math.min(255, (d[i + 2] ?? 0) + fiberNoise * 0.9))
        }
      }
    }
  }

  g.putImageData(img, 0, 0)

  // Tile border lines — subtle grid visible in close-up
  g.save()
  g.globalAlpha = 0.12
  g.strokeStyle = `rgb(${Math.max(0, base[0] - 30)},${Math.max(0, base[1] - 30)},${Math.max(0, base[2] - 30)})`
  g.lineWidth = 1
  for (let offset = 0; offset <= size; offset += tileSize) {
    g.beginPath()
    g.moveTo(offset, 0)
    g.lineTo(offset, size)
    g.stroke()
    g.beginPath()
    g.moveTo(0, offset)
    g.lineTo(size, offset)
    g.stroke()
  }

  // Fine horizontal fiber lines
  g.globalAlpha = 0.07
  g.strokeStyle = `rgb(${Math.max(0, base[0] - 20)},${Math.max(0, base[1] - 20)},${Math.max(0, base[2] - 20)})`
  for (let offset = 3; offset < size; offset += 7) {
    g.beginPath()
    g.moveTo(0, offset)
    g.lineTo(size, offset + 1)
    g.stroke()
  }
  g.restore()

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
