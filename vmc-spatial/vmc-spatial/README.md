# VMC Spatial Studio · Editor en vivo (día real)

Gemelo espacial editable del **Piso 16 (VMC)** de YPF. R3F + Drei.

## Novedades
- **Fix arrastre:** al tomar un objeto, el orbit se frena (solo movés ese objeto).
- **Paredes de monitores editables:** seleccionar, mover, rotar, **estirar largo**,
  cambiar **cantidad** y **filas**; **crear** paredes nuevas desde la paleta.
- **Piso alfombra** procedural (sin líneas raras) + **anillo más oscuro** ~3 m
  alrededor del núcleo (rodea la Value).
- **Día real:** cielo procedural (Sky) + sol + **vidriado perimetral** con vista afuera.

## Stack
Vite + React + TS + @react-three/fiber + @react-three/drei + three. Build en Vercel.

## Local
```bash
npm install && npm run dev
```
