import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // Use the Node.js environment
    globals: true, // Enable global variables like `describe`, `it`, etc.
    coverage: {
      reporter: ["text", "json", "html"], // Generate coverage reports
      include: ["src/**/*.{ts,js}"], // Include files for coverage
    },
    // setupFiles: "./test/setup.ts", // Optional: Path to a setup file
  },
});
