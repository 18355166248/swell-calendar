import react from '@vitejs/plugin-react';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import macros from 'unplugin-parcel-macros';
import { defineConfig, normalizePath } from 'vite';

// vite 传入的 importer 一律是正斜杠路径，而 node 的 resolve() 在 Windows 上返回反斜杠；
// 统一用 normalizePath 转正斜杠后再比较/返回，否则 Windows 上 startsWith 永远为 false，
// calendar 源码内部的 "@/..." 不会被重写（参见 https://github.com/.../P4 跨平台回归）。
const calendarSrcRoot = normalizePath(resolve(__dirname, '../../packages/calendar/src'));
const calendarDistRoot = normalizePath(resolve(__dirname, '../../packages/calendar/dist'));

function resolveCalendarSourcePath(relativePath: string) {
  const basePath = resolve(calendarSrcRoot, relativePath);
  const candidates = [
    resolve(basePath, 'index.ts'),
    resolve(basePath, 'index.tsx'),
    resolve(basePath, 'index.js'),
    resolve(basePath, 'index.scss'),
    resolve(basePath, 'index.css'),
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.scss`,
    `${basePath}.css`,
    basePath,
  ];

  const matched =
    candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ??
    basePath;

  return normalizePath(matched);
}

// ⚠️ macros.vite() 必须排在 react() 之前，否则 S2 的 style() macro 不会在构建期被处理，
// Vite 会报 fs/url 等 node 模块被 externalize 的错。
export default defineConfig({
  plugins: [
    {
      name: 'resolve-calendar-workspace-source',
      enforce: 'pre',
      resolveId(source, importer) {
        // dev / build 都直接读取 workspace 源码，避免本地 app 继续消费旧 dist。
        if (source === 'swell-calendar') {
          return normalizePath(resolve(calendarSrcRoot, 'index.ts'));
        }

        if (source === 'swell-calendar/style.css') {
          // calendar 运行时类名会统一加 swell-calendar- 前缀；
          // 这里继续消费包产物样式，避免 app 侧直接编译源码 SCSS 时丢失 postcss prefixer。
          const stylePath = normalizePath(resolve(calendarDistRoot, 'style.css'));
          if (!existsSync(stylePath)) {
            throw new Error(
              `[swell-calendar-s2] 找不到 ${stylePath}。` +
                '请先在仓库根目录构建 calendar 包（pnpm --filter swell-calendar build），' +
                '再启动本 app —— style.css 依赖该产物里的 postcss 类名前缀。'
            );
          }
          return stylePath;
        }

        // 仅重写 calendar 源码内部的 "@/..."，不影响 app 自己的导入语义。
        if (source.startsWith('@/') && normalizePath(importer ?? '').startsWith(calendarSrcRoot)) {
          return resolveCalendarSourcePath(source.slice(2));
        }

        return null;
      },
    },
    macros.vite(),
    react(),
  ],
});
