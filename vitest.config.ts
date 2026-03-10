import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom', // for react testing library
      setupFiles: ['./src/tests/setup.ts', './src/tests/mocks.ts'], // useful for mocks initialization
    },
  }),
);
