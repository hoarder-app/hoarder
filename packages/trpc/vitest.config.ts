/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    alias: {
      "@/*": "./*",
    },
  },
});
