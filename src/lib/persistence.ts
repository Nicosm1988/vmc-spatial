import type { VmcDocument } from '../types'
import { parseVmcDocument, safeParseVmcDocument } from '../domain/documentSchema'
const KEY = 'vmc-spatial:doc:v14'
export function loadDoc(): VmcDocument | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const result = safeParseVmcDocument(parsed)
    return result.success ? (result.data as VmcDocument) : null
  } catch {
    return null
  }
}
export function saveDoc(doc: VmcDocument): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(doc))
  } catch {}
}
export function clearDoc(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
export function exportJson(doc: VmcDocument): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vmc-piso16-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
export function importJson(file: File): Promise<VmcDocument> {
  return new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('El archivo supera los 5 MB.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result))
        resolve(parseVmcDocument(parsed))
      } catch {
        reject(new Error('La configuración no cumple el schema vmc-spatial/6.'))
      }
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsText(file)
  })
}
