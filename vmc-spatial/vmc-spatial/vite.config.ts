import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel detecta este archivo y ejecuta `vite build` en la nube.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
})
