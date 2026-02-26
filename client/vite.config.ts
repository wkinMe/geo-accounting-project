// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
    alias: {
      // Твои алиасы
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      
      // Алиасы на shared и root
      "@shared": path.resolve(__dirname, "../packages/shared"),
      "@root": path.resolve(__dirname, ".."),
      "@server": path.resolve(__dirname, "../server"),
    },
  },
});
