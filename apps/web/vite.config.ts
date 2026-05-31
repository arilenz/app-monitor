import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_TARGET = process.env.VITE_API_TARGET ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy API calls to the Express server during development so the SPA can
    // use same-origin relative URLs (/api/...).
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
    },
  },
});
