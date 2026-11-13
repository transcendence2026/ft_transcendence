import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
	  disable: false, // Desactiva el Service Worker y su registro para evitar el fallo con SSL autofirmado
      registerType: "autoUpdate",
	  //devOptions: { enabled: false },
      includeAssets: [],
      manifest: {
        name: "TasteSync",
        short_name: "TasteSync",
        description: "Plataforma interactiva y competitiva en tiempo real",
        theme_color: "#030712",
        background_color: "#030712",
        display: "standalone",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
		    navigateFallback: "/index.html",
		    navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            //urlPattern: /^\/api\/(auth\/me|social\/feed)/,
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/api/auth/me") ||
              url.pathname.startsWith("/api/social/feed"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-offline-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 *24,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
