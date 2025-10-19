import { defineConfig } from 'vitest/config'
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
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'cyberstreams/src/**/*.test.ts',
      'cyberstreams/src/**/*.test.tsx',
      'ingestion/**/*.test.ts'
    ],
    globals: true,
    coverage: {
      reporter: ['text', 'json-summary'],
    },
  },
})
