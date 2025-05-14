import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entryPoints: {
    Day: 'src/Day/index.tsx',
  },
  format: ['cjs', 'esm'],
  dts: true,
  external: ['react'],
  ...options,
}));
