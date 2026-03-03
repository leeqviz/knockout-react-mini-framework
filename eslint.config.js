import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Экспортируем ОБЫЧНЫЙ МАССИВ. Никаких оберток!
export default [
  // 1. Игнорируемые файлы (должны идти отдельным объектом в самом начале)
  { ignores: ['dist', 'node_modules', 'build'] },

  // 2. Базовые конфиги ESLint и TypeScript
  // js.configs.recommended - это объект, кладем его как есть
  js.configs.recommended,
  // tseslint.configs.recommended - это массив объектов, поэтому распыляем его через ...
  ...tseslint.configs.recommended,

  // 3. Наши кастомные настройки для гибридного проекта
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        // Наши легаси-глобалки
        ko: 'readonly',
        $: 'readonly',
        jQuery: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
];
