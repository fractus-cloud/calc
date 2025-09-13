import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  server: {
    preset: "cloudflare_module",
    compatibilityDate: "2025-09-12"
  }
});