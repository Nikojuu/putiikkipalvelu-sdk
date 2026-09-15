import { defineConfig } from "vitest/config";
import pkg from "./package.json";

export default defineConfig({
  // Mirror tsup.config.ts so tests exercise the real x-sdk-version value
  define: {
    __SDK_VERSION__: JSON.stringify(pkg.version),
  },

  test: {
    // Global test functions (describe, it, expect) without imports
    globals: true,

    // Test environment
    environment: "node",

    // Include test files
    include: ["tests/**/*.test.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/types/**"],
    },
  },
});
