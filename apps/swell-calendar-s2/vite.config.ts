import react from '@vitejs/plugin-react';
import macros from 'unplugin-parcel-macros';
import { defineConfig } from 'vite';

// ⚠️ macros.vite() 必须排在 react() 之前，否则 S2 的 style() macro 不会在构建期被处理，
// Vite 会报 fs/url 等 node 模块被 externalize 的错。
export default defineConfig({
  plugins: [macros.vite(), react()],
});
