import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@theme": path.resolve(__dirname, "./src/theme"),
      "@tokens": path.resolve(__dirname, "./src/tokens"),
      "@data": path.resolve(__dirname, "./src/data"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "cyberstreams/src/**/*.test.ts",
      "cyberstreams/src/**/*.test.tsx",
      "ingestion/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
    exclude: [
      "cyberstreams/src/modules/__tests__/ui.no-data.smoke.test.tsx",
      "tests/unit/comprehensive.test.ts",
    ],
    globals: true,
    // coverage: {
    //   provider: 'istanbul',
    //   reporter: ['text', 'json-summary'],
    // },
  },
});
