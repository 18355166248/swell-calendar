import './manager.css';

import { createElement } from 'react';
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

import { getStorybookSidebarMeta, storybookTheme } from '../src/stories/showcase';

const logoSvg = `<svg width="170" height="28" viewBox="0 0 170 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d9894d"/>
      <stop offset="1" stop-color="#b45d33"/>
    </linearGradient>
  </defs>
  <rect x="2" y="3" width="22" height="22" rx="6" fill="url(#scg)"/>
  <rect x="6.5" y="8.5" width="13" height="11" rx="2.2" fill="#173936"/>
  <rect x="6.5" y="8.5" width="13" height="3.2" rx="1.6" fill="#24524d"/>
  <circle cx="9.6" cy="15" r="1.05" fill="#f4d3bc"/>
  <circle cx="13" cy="15" r="1.05" fill="#edbf99"/>
  <circle cx="16.4" cy="15" r="1.05" fill="#d9894d"/>
  <text font-family="Baskerville, Georgia, serif" font-size="15" y="19">
    <tspan x="32" font-weight="700" fill="#2b231c">Swell </tspan><tspan font-weight="400" fill="#7b6857">Calendar</tspan>
  </text>
</svg>`;

const brandImage = `data:image/svg+xml;utf8,${encodeURIComponent(logoSvg)}`;

function renderSidebarLabel(item: { depth?: number; name: string; type?: string }) {
  const meta = getStorybookSidebarMeta(item);
  const depth = item.depth ?? 0;
  const isRoot = item.type === 'root';
  const isStory = item.type === 'story';
  const isDeepGroup = item.type === 'group' && depth >= 2;
  const showBadge = Boolean(meta.badge) && !isStory && (isRoot || meta.emphasized);
  const showCaption = Boolean(meta.caption) && !isStory && !isDeepGroup;

  return createElement(
    'span',
    {
      className: 'sb-manager-sidebar-label',
      'data-tone': meta.tone,
      'data-depth': String(depth),
      'data-emphasis': meta.emphasized ? 'true' : 'false',
      'data-type': item.type ?? 'unknown',
      'data-compact': isStory || isDeepGroup ? 'true' : 'false',
    },
    createElement(
      'span',
      { className: 'sb-manager-sidebar-label__row' },
      showBadge
        ? createElement('span', { className: 'sb-manager-sidebar-label__badge' }, meta.badge)
        : createElement('span', {
            className: 'sb-manager-sidebar-label__marker',
            'aria-hidden': 'true',
          }),
      createElement('span', { className: 'sb-manager-sidebar-label__title' }, item.name)
    ),
    showCaption
      ? createElement('span', { className: 'sb-manager-sidebar-label__caption' }, meta.caption)
      : null
  );
}

addons.setConfig({
  showPanel: false,
  panelPosition: 'right',
  enableShortcuts: true,
  theme: create({
    base: 'light',
    brandTitle: 'Swell Calendar',
    brandImage,
    brandUrl: './',
    colorPrimary: storybookTheme.colorPrimary,
    colorSecondary: storybookTheme.colorSecondary,
    appBg: storybookTheme.appBg,
    appContentBg: storybookTheme.appContentBg,
    appPreviewBg: storybookTheme.appPreviewBg,
    appBorderColor: storybookTheme.borderColor,
    appBorderRadius: storybookTheme.borderRadius,
    barBg: '#f8f2e8',
    barTextColor: storybookTheme.textMutedColor,
    barSelectedColor: storybookTheme.colorPrimary,
    barHoverColor: '#9f5d30',
    textColor: storybookTheme.textColor,
    textMutedColor: storybookTheme.textMutedColor,
    textInverseColor: '#fffaf2',
    inputBg: storybookTheme.inputBg,
    inputBorder: storybookTheme.inputBorder,
    inputTextColor: storybookTheme.textColor,
    inputBorderRadius: 10,
    fontBase: storybookTheme.fontBase,
    fontCode: storybookTheme.fontCode,
  }),
  sidebar: {
    showRoots: true,
    renderLabel: renderSidebarLabel,
  },
  toolbar: {
    zoom: { hidden: true },
    eject: { hidden: true },
  },
});
