import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsConfigPaths()],
  resolve: {
    conditions: ['one-step-at-a-time', 'browser', 'module', 'main'],
  },
  test: {
    environment: 'jsdom',
    include: ['app/**/*.test.ts', 'app/**/*.test.tsx'],
  },
});
