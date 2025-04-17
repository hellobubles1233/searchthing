import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: process.env.NETLIFY ? "/" : undefined,
  build: {
    outDir: "dist"
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
    }),
  ],
});
