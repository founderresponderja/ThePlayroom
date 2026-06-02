import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '.',
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts']
  },
  esbuild: {
    tsconfig: './tsconfig.json'
  }
});
