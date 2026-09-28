import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const api = process.env.TAIKO_API_URL || "http://127.0.0.1:8000";

export default defineConfig({
  // relative addresses, so one build runs at a domain root and in a sub-folder
  base: "./",
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    proxy: { "/api": { target: api, changeOrigin: true } },
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  preview: {
    proxy: { "/api": { target: api, changeOrigin: true } },
  },
  plugins: [react()],
});
