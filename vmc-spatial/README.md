# VMC Spatial Studio · Piso 16 (layout confirmado)

Gemelo espacial del **Piso 16 (VMC)** de YPF — Torre YPF, Puerto Madero. R3F + Drei.

## 🗺️ Layout (maqueta confirmada)

- **Núcleo:** caras **N y S rectas** (2 video walls), **chaflán** al frente (Este), **punta** al fondo (Oeste).
- **Islas BENCH** (mesas ENFRENTADAS, monitores enteros espalda con espalda, perpendiculares al borde):
  - **Norte izquierdo:** 2 de 3 → **Larga 5 (paralela)** → 1 de 3 → mesa madera → **sala circular**.
  - **Norte derecho:** 4 de 3 → mesa madera → **oficina circular**.
  - **SE:** 4 de 3 · **SO:** 4 de 3.
- **Frente (Este):** 3 oficinas (central grande + N + S).
- **Oeste:** 2 salas de reunión rectangulares.

"de 3" = 3 pares enfrentados (6 puestos). Posiciones calcadas de la maqueta.

## 🪑 Muebles
Silla Herman Miller · monitor ENTERO · video wall (grilla + credenza) · mesas madera · salas/oficinas circulares.

## 🧱 Stack
Vite + React + TS + @react-three/fiber + @react-three/drei + three. Build en Vercel.

## 🚀 Local
```bash
npm install && npm run dev
```
## 📐 Ajustar
Zonas en `src/data/vmcPiso16.ts` (cx, cy en mm, rot en rad, pairs). También desde el Inspector (Editar).
