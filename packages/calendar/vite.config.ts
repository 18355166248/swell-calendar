import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 如果需要全局 scss 变量，可以在这里配置
        // additionalData: `@import "@/styles/variables.scss";`
      },
    },
  },
  build: {
    lib: {
      entry: {
        'Day/index': resolve(__dirname, 'src/components/view/Day/index.tsx'),
        'css/index': resolve(__dirname, 'src/css/index.scss'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    outDir: 'dist',
    // emptyOutDir: true, // 构建前清空输出目录
  },
});
