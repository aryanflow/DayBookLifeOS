import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync, existsSync } from "fs";
import { syncDevPlugin } from "./vite.sync-dev.js";

function faviconPlugin() {
  return {
    name: "daybook-favicon",
    transformIndexHtml(html) {
      const pngPath = "public/favicon-32.png";
      if (!existsSync(pngPath)) return html;
      const dataUri = `data:image/png;base64,${readFileSync(pngPath).toString("base64")}`;
      const tags = [
        `<link rel="icon" href="${dataUri}" type="image/png" sizes="32x32" />`,
        `<link rel="icon" href="/favicon.ico?v=4" sizes="any" />`,
        `<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4" />`,
      ].join("\n    ");
      return html.replace("</head>", `    ${tags}\n  </head>`);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    syncDevPlugin(),
    faviconPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "favicon-16.png",
        "favicon-32.png",
        "favicon-48.png",
        "apple-touch-icon.svg",
        "apple-touch-icon.png",
        "icon-192.svg",
        "icon-512.svg",
        "icon-512.png",
        "icon-maskable.svg",
      ],
      manifest: {
        name: "Daybook - Life OS",
        short_name: "Daybook",
        description: "Your private daily Life OS. Track habits, spending, meals, work, and wellness.",
        theme_color: "#EEEAF4",
        background_color: "#EEEAF4",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icon-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
          {
            src: "apple-touch-icon.svg",
            sizes: "180x180",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
