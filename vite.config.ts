
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    allowedHosts: "ddrvn3-8115.csb.app"
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        popup: path.resolve(__dirname, 'public/popup.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? path.basename(chunkInfo.facadeModuleId, path.extname(chunkInfo.facadeModuleId)) : 'unknown';
          return `assets/${facadeModuleId}.js`;
        },
      },
    },
  },
}));
