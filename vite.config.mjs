import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Development only: the frame meter (?fps) reports here, so that a phone on
// the same network can be read from the server's log.
const frames = {
  name: "frames",
  configureServer(server) {
    server.middlewares.use("/__frames", (request, response) => {
      let body = "";
      request.on("data", chunk => { body += chunk; });
      request.on("end", () => {
        console.log(`[frames] ${body.slice(0, 200)}`);
        response.statusCode = 204;
        response.end();
      });
    });
  },
};

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
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), frames],
});
