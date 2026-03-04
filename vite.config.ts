import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    // Настраиваем Rollup (движок сборки под капотом Vite)
    rollupOptions: {
      output: {
        // Функция ручной нарезки чанков
        manualChunks: {
          // Выделяем React и сопутствующие библиотеки в чанк 'react-vendor'
          'react-vendor': ['react', 'react-dom'],
          // Выделяем jQuery в отдельный чанк
          'jquery-vendor': ['jquery', 'jquery-ui'],
          'knockout-vendor': ['knockout'],
          'zustand-vendor': ['zustand'],
        },
      },
    },
  },
});
