import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { ViteEjsPlugin } from "./vitePluginEjs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), ViteEjsPlugin()],
  define: {
    // By default, Vite doesn't include shims for NodeJS/
    // necessary for segment analytics lib to work
    global: {},
  },
});
