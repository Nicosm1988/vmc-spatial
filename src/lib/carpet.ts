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
  let seed = 0x7f4a7c15
  const noise = () => {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0
    return seed / 4_294_967_296
  }
  for (let i = 0; i < d.length; i += 4) {
    const n = (noise() - 0.5) * 40
    const red = d[i] ?? base[0]
    const green = d[i + 1] ?? base[1]
    const blue = d[i + 2] ?? base[2]
    d[i] = Math.max(0, Math.min(255, red + n))
    d[i + 1] = Math.max(0, Math.min(255, green + n))
    d[i + 2] = Math.max(0, Math.min(255, blue + n * 1.1))
  }
  g.putImageData(img, 0, 0)
  g.save()
  g.globalAlpha = 0.16
  g.strokeStyle = `rgb(${Math.max(0, base[0] - 38)},${Math.max(0, base[1] - 38)},${Math.max(0, base[2] - 38)})`
  g.lineWidth = 1
  for (let offset = 0; offset <= size; offset += size / 8) {
    g.beginPath()
    g.moveTo(offset, 0)
    g.lineTo(offset, size)
    g.stroke()
    g.beginPath()
    g.moveTo(0, offset)
    g.lineTo(size, offset)
    g.stroke()
  }
  g.globalAlpha = 0.1
  for (let offset = 3; offset < size; offset += 11) {
    g.beginPath()
    g.moveTo(0, offset)
    g.lineTo(size, offset + 2)
    g.stroke()
  }
  g.restore()
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
