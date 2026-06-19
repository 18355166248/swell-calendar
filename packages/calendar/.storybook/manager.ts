import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// 品牌 logo（内联 SVG → data URI，深色主题下使用浅色字 + 紫色日历图标）
const logoSvg = `<svg width="170" height="28" viewBox="0 0 170 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a78bfa"/>
      <stop offset="1" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect x="2" y="3" width="22" height="22" rx="6" fill="url(#scg)"/>
  <rect x="6.5" y="8.5" width="13" height="11" rx="2.2" fill="#0b1020"/>
  <rect x="6.5" y="8.5" width="13" height="3.2" rx="1.6" fill="#1b1340"/>
  <circle cx="9.6" cy="15" r="1.05" fill="#c4b5fd"/>
  <circle cx="13" cy="15" r="1.05" fill="#a78bfa"/>
  <circle cx="16.4" cy="15" r="1.05" fill="#7c3aed"/>
  <text font-family="Segoe UI, PingFang SC, sans-serif" font-size="15" y="19">
    <tspan x="32" font-weight="700" fill="#e2e8f0">Swell </tspan><tspan font-weight="500" fill="#94a3b8">Calendar</tspan>
  </text>
</svg>`;

const brandImage = `data:image/svg+xml;utf8,${encodeURIComponent(logoSvg)}`;

addons.setConfig({
  showPanel: false,
  panelPosition: 'right',
  enableShortcuts: true,
  theme: create({
    base: 'dark',
    brandTitle: 'Swell Calendar',
    brandImage,
    brandUrl: './',

    // 强调色（紫罗兰）：驱动选中项、链接、active 高亮
    colorPrimary: '#a78bfa',
    colorSecondary: '#8b5cf6',

    // 深色画布层级
    appBg: '#0b1020',
    appContentBg: '#0d1326',
    appPreviewBg: '#0b1020',
    appBorderColor: 'rgba(148, 163, 184, 0.16)',
    appBorderRadius: 12,

    // 工具栏
    barBg: '#0d1326',
    barTextColor: '#94a3b8',
    barSelectedColor: '#c4b5fd',
    barHoverColor: '#a78bfa',

    // 文本
    textColor: '#e2e8f0',
    textMutedColor: '#94a3b8',
    textInverseColor: '#0b1020',

    // 输入
    inputBg: '#0b1020',
    inputBorder: 'rgba(148, 163, 184, 0.22)',
    inputTextColor: '#e2e8f0',
    inputBorderRadius: 8,

    fontBase: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontCode: '"JetBrains Mono", "Cascadia Code", monospace',
  }),
  sidebar: {
    showRoots: true,
  },
  toolbar: {
    zoom: { hidden: true },
    eject: { hidden: true },
  },
});
