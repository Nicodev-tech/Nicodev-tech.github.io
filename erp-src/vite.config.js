import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: './' → assets con rutas relativas, necesario para GitHub Pages
// outDir: '../erp' → el build queda directamente en la carpeta servida
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../erp",
    emptyOutDir: true,
  },
});
