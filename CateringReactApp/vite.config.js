import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: "Expense Manager",
        short_name: "ExpenseManager",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        icons: [],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "https://cateringexpensemanagement.onrender.com",
        changeOrigin: true,
      },
    },
  },
});
