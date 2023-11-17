import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import eslint from "vite-plugin-eslint";
import { splitVendorChunkPlugin } from 'vite';
export default defineConfig({
  plugins: [react(), eslint() ],
  build: {
    rollupOptions: {
      output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    }
  }
);
