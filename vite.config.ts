import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './cyberstreams/src'),
      '@modules': path.resolve(__dirname, './cyberstreams/src/modules'),
      '@components': path.resolve(__dirname, './cyberstreams/src/components'),
      '@theme': path.resolve(__dirname, './cyberstreams/src/theme'),
      '@tokens': path.resolve(__dirname, './cyberstreams/src/tokens'),
      '@data': path.resolve(__dirname, './cyberstreams/src/data'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'lucide': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
