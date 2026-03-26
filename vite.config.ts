import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
  root: "web",
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, "web/src/lib"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:3271",
      "/ws": {
        target: "ws://localhost:3271",
        ws: true,
      },
    },
  },
});
