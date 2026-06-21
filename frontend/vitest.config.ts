import { svelteTesting } from "@testing-library/svelte/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte({ hot: false }), svelteTesting()],
  resolve: {
    conditions: ["browser"],
    alias: {
      $lib: path.resolve(__dirname, "src/lib"),
      "$app/environment": path.resolve(
        __dirname,
        "src/lib/shared/testing/app-environment.stub.ts"
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.ts"],
  },
});
