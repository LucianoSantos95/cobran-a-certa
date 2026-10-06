import path from "node:path";
import { defineConfig } from "vitest/config";

// Config de teste separada do vite.config.ts: aquele carrega o plugin do TanStack
// Start/Nitro, que não faz sentido (nem é necessário) para testar funções puras.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
