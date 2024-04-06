import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { ViteEjsPlugin } from "./vitePluginEjs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), ViteEjsPlugin()],
});
