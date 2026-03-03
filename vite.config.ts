import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Настраиваем Rollup (движок сборки под капотом Vite)
    rollupOptions: {
      output: {
        // Функция ручной нарезки чанков
        manualChunks(id) {
          // Параметр 'id' — это полный путь к каждому файлу, который проходит через сборщик.
          // Если файл лежит в папке node_modules, значит это сторонняя библиотека.
          if (id.includes('node_modules')) {
            // 1. Выделяем ядро React и стейт-менеджер в чанк 'react-vendor'
            if (id.includes('react')) {
              return 'react-vendor';
            }

            // 2. Выделяем тяжелое легаси в чанк 'legacy-vendor'
            if (id.includes('knockout')) {
              return 'knockout-vendor';
            }

            if (id.includes('jquery')) {
              return 'jquery-vendor';
            }

            // 3. Все остальные мелкие библиотеки из npm отправляем в общий чанк 'vendor'
            // (например, lodash, date-fns, axios и т.д.)
            return 'vendor';
          }

          // Если функция ничего не возвращает, Vite оставит файл в основном чанке (вашем index.js)
          return undefined;
        },
      },
    },
    // Опционально: можно чуть поднять лимит предупреждения,
    // так как react-dom сам по себе весит около 130kb (minified)
    chunkSizeWarningLimit: 600,
  },
});
