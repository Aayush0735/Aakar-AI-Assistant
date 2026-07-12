import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cssInjectedByJsPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Inject the Next.js API URL environment variable during build
    "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(process.env.NEXT_PUBLIC_API_URL || ""),
    "process.env": {},
  },
  build: {
    outDir: "public",
    emptyOutDir: false, // Don't delete Next.js public files
    lib: {
      entry: path.resolve(__dirname, "src/widget.tsx"),
      name: "AakarsChatWidget",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    rollupOptions: {
      // Do not externalize react/react-dom, we want them bundled into the single file
      external: [],
    },
  },
});
