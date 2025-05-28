import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: {
    'Day/index': 'src/components/view/Day/index.tsx',
    'TimeGrid/index': 'src/components/timeGrid/timeGrid.tsx',
  },
  format: ['cjs', 'esm'],
  dts: true,
  external: ['react'],
  outDir: 'dist',
  clean: true,
  ...options,
}));
