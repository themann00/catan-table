/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "favicon.png", "apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Catan Table",
        short_name: "Catan Table",
        description: "Dice, odds, board setup, and score tracking for Catan at the table. Works offline.",
        theme_color: "#1b3a4b",
        background_color: "#1b3a4b",
        display: "standalone",
        orientation: "any",
        // Relative on purpose: an absolute start_url fails installability on
        // preview deploys because it would be cross-origin from the manifest.
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Everything the app needs is static, so precache it all for offline use.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,txt,woff2}"],
        // Only crawlers fetch the OG image; keep it out of the offline cache.
        globIgnores: ["**/og.jpg"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
}));
