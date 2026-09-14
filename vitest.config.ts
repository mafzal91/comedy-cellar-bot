import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts"],
    exclude: ["packages/frontend/**", "**/node_modules/**"],
  },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "packages/core"),
      "@customTypes": path.resolve(__dirname, "packages/types"),
    },
  },
});
