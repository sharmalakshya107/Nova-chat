import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@config": path.resolve(__dirname, "src/config"),
      "@modules": path.resolve(__dirname, "src/modules"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 15000,
  },
});
