import type { VmcDocument } from '../types'
const KEY = 'vmc-spatial:doc:v13'
export function loadDoc(): VmcDocument | null {
  try { const raw = localStorage.getItem(KEY); if (!raw) return null; const p = JSON.parse(raw); return p && p.schema === 'vmc-spatial/6' ? p as VmcDocument : null } catch { return null }
}
export function saveDoc(doc: VmcDocument): void { try { localStorage.setItem(KEY, JSON.stringify(doc)) } catch { /* noop */ } }
export function clearDoc(): void { try { localStorage.removeItem(KEY) } catch { /* noop */ } }
export function exportJson(doc: VmcDocument): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = `vmc-piso16-${Date.now()}.json`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}
export function importJson(file: File): Promise<VmcDocument> {
  return new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) { reject(new Error('El archivo supera los 5 MB.')); return }
    const reader = new FileReader()
    reader.onload = () => { try { const p = JSON.parse(String(reader.result)); if (!p || p.schema !== 'vmc-spatial/6') { reject(new Error('No es válido.')); return } resolve(p as VmcDocument) } catch { reject(new Error('No se pudo leer.')) } }
    reader.onerror = () => reject(new Error('Error de lectura.')); reader.readAsText(file)
  })
}
