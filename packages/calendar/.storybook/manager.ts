import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  showPanel: false,
  panelPosition: 'right',
  enableShortcuts: true,
  theme: create({
    base: 'light',
    brandTitle: 'Swell Calendar Workbench',
    brandUrl: 'http://localhost:6006',
    appBg: '#edf1f6',
    appContentBg: '#f8fafc',
    appPreviewBg: '#edf1f6',
    appBorderColor: 'rgba(148, 163, 184, 0.18)',
    appBorderRadius: 14,
    barBg: '#ffffff',
    barTextColor: '#475569',
    barSelectedColor: '#0f172a',
    textColor: '#0f172a',
    textMutedColor: '#64748b',
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
