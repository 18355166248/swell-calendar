import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: {
    'Day/index': 'src/components/Day/index.tsx',
  },
  format: ['cjs', 'esm'],
  dts: true,
  external: ['react'],
  outDir: 'dist',
  clean: true,
  ...options,
}));
