import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Caminhos relativos: permite servir o build de qualquer pasta/host,
  // inclusive embarcado no app.
  base: "./",
  server: {
    // Expõe na rede local para abrir no celular/simulador pelo IP do Mac.
    host: true,
    port: 5173,
  },
});
