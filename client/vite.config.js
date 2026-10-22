import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

import { checkProductionApiUrl } from './deploy/checkApiUrl.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (process.env.VERCEL && mode === 'production') {
    const problem = checkProductionApiUrl(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL)
    if (problem) throw new Error(`[deploy] ${problem}`)
  }
  return {
    plugins: [react(), tailwindcss()],
    // client/src/assets/logo.55 is a real WebP image behind a non-standard
    // extension (Phase 6 §17 — inspected via magic bytes, not assumed from the
    // filename). `assetsInclude` tells Vite to treat it as a static asset
    // (import gives a URL) instead of trying to parse it as JS. The source
    // file itself is left untouched at its original path/extension.
    assetsInclude: ['**/*.55'],
    build: {
      rollupOptions: {
        output: {
          // Vite would otherwise emit the built asset with the same ".55"
          // extension, which browsers/CDNs (including Vercel's static file
          // serving) can't map to the correct `image/webp` content type.
          // Renaming only the build OUTPUT to .webp (never the source file)
          // fixes that without needing any other special-case handling.
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name ?? assetInfo.names?.[0] ?? ''
            if (name.endsWith('.55')) {
              return 'assets/[name]-[hash].webp'
            }
            return 'assets/[name]-[hash][extname]'
          },
        },
      },
    },
  }
})
