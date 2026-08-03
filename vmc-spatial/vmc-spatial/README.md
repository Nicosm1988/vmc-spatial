# VMC Spatial Studio · Piso 16

Gemelo espacial del **Piso 16 (VMC)** de YPF — Torre YPF, Puerto Madero. R3F + Drei.

## 🖥️ Paredes de pantallas (corregidas)

Núcleo = **diamante asimétrico** (atrás corto / frente largo). En las 4 caras hay
**PAREDES MACIZAS de piso a techo** (revestimiento) con la grilla de pantallas
montada en la **banda superior** (2 filas) — NO bajan al piso ni tienen credenzas.

Cantidad EXACTA por pared:
- **Frente-Norte (derecho adelante):** 30
- **Frente-Sur (izquierdo adelante):** 20
- **Atrás-Norte (izquierda atrás):** 24
- **Atrás-Sur (derecha atrás):** 24

## 🪑 Islas BENCH (mesas enfrentadas)
NI: 2 de 3 → Larga 5 (paralela) → 1 de 3 → mesa madera → sala circular.
ND: 4 de 3 → mesa madera → oficina circular. SE: 4 de 3 · SO: 4 de 3.
Frente (Este): 3 oficinas. Oeste: 2 salas.

## 🧱 Stack
Vite + React + TS + @react-three/fiber + @react-three/drei + three. Build en Vercel.

## 🚀 Local
```bash
npm install && npm run dev
```
## 📐 Ajustar
Pantallas por pared: campo `pantallas` en `videoWalls`. Núcleo: `CORE`. Islas: `cx,cy,rot,pairs`.
