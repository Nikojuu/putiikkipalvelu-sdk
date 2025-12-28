import { defineConfig } from "tsup";

export default defineConfig({
  // Entry point
  entry: ["src/index.ts"],

  // Output formats: ESM (.js) and CommonJS (.cjs)
  format: ["esm", "cjs"],

  // Generate TypeScript declaration files (.d.ts)
  dts: true,

  // Generate source maps for debugging
  sourcemap: true,

  // Clean dist folder before each build
  clean: true,

  // Minify production builds
  minify: false,

  // Split code into chunks (better tree-shaking)
  splitting: true,

  // Target modern Node.js
  target: "node18",
});
