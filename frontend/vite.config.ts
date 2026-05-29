import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// @cofhe/sdk ships a wasm-bindgen TFHE module whose glue import (./tfhe_bg.js)
// gets mangled when esbuild pre-bundles it in dev, causing
// "WebAssembly.instantiate(): Import #0 ./tfhe_bg.js ... not an object".
// Excluding it from dep optimization makes Vite serve the SDK's own ESM
// untouched (the same wiring that works in the production rolldown build).
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@cofhe/sdk'],
  },
})
