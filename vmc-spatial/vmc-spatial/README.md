# VMC Spatial Studio · Piso 16 (islas de escritorios ENFRENTADOS)

Gemelo espacial del **Piso 16 (VMC)** de YPF — Torre YPF, Puerto Madero. R3F + Drei.

## 🪑 Islas tipo BENCH (monitores enfrentados)

Cada isla es un **bench**: dos filas de escritorios **enfrentadas**, con los monitores
espalda con espalda en el centro (enfrentados vistos de arriba) y las **sillas Herman
Miller** en los lados externos. `pairs` = pares de puestos por bench (por defecto 3 → 3+3).

- Componente `DeskBench` en `Furniture.tsx`. Monitor ENTERO (un panel).
- Cada isla se **rota** (`z.rot`) para seguir el ángulo de la fachada.

## 🗺️ Contorno trazado del CAD

Ojo facetado con puntas agudas · núcleo DIAMANTE con 4 video walls · sala alargada
(mesa ~10) y 3 oficinas en el FRENTE (Este) · pods redondos y 2 salas al Oeste.

## 🧱 Stack
Vite + React + TS + @react-three/fiber + @react-three/drei + three. Build en Vercel.

## 🚀 Local
```bash
npm install && npm run dev
```
## 📐 Ajustar
- Contorno: `PLATE`. Núcleo: `CORE`. Islas: helper `zc(..., rotGrados, ..., pairs, ...)`.
- Pares por isla: campo `pairs` (también editable desde el Inspector).
