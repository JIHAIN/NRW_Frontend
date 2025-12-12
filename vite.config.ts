import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://alain.r-e.kr", // 백엔드 주소
        changeOrigin: true,
        secure: false,
      },
      "/async": {
        target: "https://alain.r-e.kr",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
