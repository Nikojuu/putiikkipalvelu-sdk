import { defineConfig } from "vitest/config";

export default defineConfig({
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
