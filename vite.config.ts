import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/Portpolio_Core_Front/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500, // optional: raise if you want
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("lightweight-charts")) {
              return "vendor_charts";
            }
            if (id.includes("html2canvas")) {
              return "vendor_html2canvas";
            }
            return "vendor"; // everything else in node_modules
          }
        },
      },
    },
  },
});
