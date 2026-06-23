import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// PWA uses injectManifest so we can ship a custom service worker (src/sw.ts)
// that handles `push` + `notificationclick` for web-push reminders (Phase 7),
// while Workbox still precaches the app shell for installability.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "FitFutures by UKFI",
        short_name: "FitFutures",
        description: "AI-accountability-first CPD placement tracker.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0D1117",
        theme_color: "#0D1117",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
