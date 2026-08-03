# VMC Spatial Studio · Piso 16

Gemelo espacial del **Piso 16 (VMC)** de YPF — Torre YPF, Puerto Madero. R3F + Drei.

## 🔶 Núcleo = DIAMANTE asimétrico (4 caras con pantallas)

- 4 vértices: **Oeste (atrás)**, Norte, **Este (frente)**, Sur.
- Los **lados de atrás (Oeste) son más CORTOS** (~8,3 m) y los del **frente (Este) más LARGOS** (~13,3 m).
- **Video walls en las 4 CARAS** del diamante — incluida la del **fondo (Oeste)**, mirando hacia afuera (a los escritorios).

## 🪑 Islas BENCH (mesas enfrentadas)

Dos filas enfrentadas, monitores enteros espalda con espalda, sillas Herman Miller.
- **NI:** 2 de 3 → Larga 5 (paralela) → 1 de 3 → mesa madera → sala circular.
- **ND:** 4 de 3 → mesa madera → oficina circular.
- **SE:** 4 de 3 · **SO:** 4 de 3.
- **Frente (Este):** 3 oficinas. **Oeste:** 2 salas rectangulares.

## 🧱 Stack
Vite + React + TS + @react-three/fiber + @react-three/drei + three. Build en Vercel.

## 🚀 Local
```bash
npm install && npm run dev
```
## 📐 Ajustar
Núcleo: array `CORE` (4 vértices). Paredes: `videoWalls`. Islas: `cx, cy, rot, pairs`.
