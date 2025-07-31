import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1", // Use IPv4
    port: 43000, // Use your desired port
  },
  plugins: [react()],
});
