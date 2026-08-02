// ============================================================================
// Persistencia local. El documento se guarda en localStorage (~700 ms después
// de cada cambio, igual espíritu que el autosave de Senda). El JSON exportado
// sigue siendo el respaldo portable recomendado.
// ============================================================================
import type { VmcDocument } from '../types'

const KEY = 'vmc-spatial:doc'

export function loadDoc(): VmcDocument | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.schema === 'vmc-spatial/1') return parsed as VmcDocument
    return null
  } catch {
    return null
  }
}

export function saveDoc(doc: VmcDocument): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(doc))
  } catch {
    // Silencioso: modo privado o storage lleno.
  }
}

export function clearDoc(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

// Descarga el documento como archivo .json.
export function exportJson(doc: VmcDocument): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vmc-piso16-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Lee y valida un archivo .json importado (máx 5 MB).
export function importJson(file: File): Promise<VmcDocument> {
  return new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('El archivo supera los 5 MB.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!parsed || parsed.schema !== 'vmc-spatial/1') {
          reject(new Error('El archivo no es un documento vmc-spatial válido.'))
          return
        }
        resolve(parsed as VmcDocument)
      } catch (e) {
        reject(new Error('No se pudo leer el JSON.'))
      }
    }
    reader.onerror = () => reject(new Error('Error de lectura del archivo.'))
    reader.readAsText(file)
  })
}
