import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore TypeScript warnings during build
        if (warning.code === 'TS7026' || warning.code === 'TS7016') {
          return
        }
        warn(warning)
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@components': path.resolve(__dirname, './src/components'),
      '@theme': path.resolve(__dirname, './src/theme'),
      '@tokens': path.resolve(__dirname, './src/tokens'),
      '@data': path.resolve(__dirname, './src/data'),
    },
  },
})
