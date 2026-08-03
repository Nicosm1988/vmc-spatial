# VMC Spatial Studio · Piso 16 (calcado del plano CAD)

Gemelo espacial del **Piso 16 (VMC)** de YPF — Torre YPF, Puerto Madero. Vista 3D con **React Three Fiber + Drei**.

## 🗺️ Contorno TRAZADO A MANO (no fórmula)

A diferencia de versiones anteriores (elipse por fórmula), esta versión **calca el plano CAD**:
- **Silueta:** ojo/rombo **facetado** con lados rectos y **puntas agudas** (Oeste blunt, Este aguda).
- **Núcleo DIAMANTE** central (rombo elongado E-O) con 4 Video Walls en sus caras.
- **Islas ROTADAS** siguiendo el ángulo de la fachada (cada una con su `rot`).
- **FRENTE = Este:** sala alargada (mesa larga ~10) + 3 oficinas (centro grande + 2 chicas).
- **Columnas** del pasillo del frente. **Pods redondos** al Oeste. 2 salas de reunión.

Toda la geometría (contorno, núcleo, columnas, zonas con rotación) vive en `src/data/vmcPiso16.ts` y se puede afinar a mano.

## 🪑 Muebles

Silla Herman Miller · monitor curvo ULTRAWIDE entero · escritorio blanco bench · video wall (grilla + credenza). Environment (reflejos) + ContactShadows.

## 🧱 Stack
Vite + React + TS + @react-three/fiber + @react-three/drei + three. Build en Vercel.

## 🚀 Local
```bash
npm install && npm run dev
```
## ☁️ Deploy
Vercel detecta `vercel.json` (Vite). Root Directory = carpeta con `package.json`.

## 📐 Ajustar el calco
- Contorno: array `PLATE` (mm). Núcleo: `CORE`. Columnas: `COLUMNS`.
- Islas: helper `zc(id, nombre, kind, cx, cy, w, h, rotGrados, ...)`.
