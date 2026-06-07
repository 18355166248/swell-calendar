import '../src/css/index.scss';

import type { Preview } from '@storybook/react-vite';
import { createElement, type CSSProperties } from 'react';

function getWorkbenchStyles(title?: string, storyName?: string) {
  const isCalendarStory = title?.startsWith('日历/') ?? false;

  const shell: CSSProperties = {
    minHeight: '100vh',
    boxSizing: 'border-box',
    padding: isCalendarStory ? '16px' : '32px 20px',
    background:
      'radial-gradient(circle at top, rgba(15, 23, 42, 0.05), transparent 26%), linear-gradient(180deg, #f5f7fb 0%, #edf1f6 100%)',
  };

  const chrome: CSSProperties = isCalendarStory
    ? {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        padding: '0 6px',
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 980,
        margin: '0 auto',
        marginBottom: 12,
        padding: '0 4px',
      };

  const badge: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.82)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
    color: '#0f172a',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.02em',
    backdropFilter: 'blur(10px)',
  };

  const badgeSubtle: CSSProperties = {
    color: '#64748b',
    fontWeight: 500,
  };

  const stage: CSSProperties = isCalendarStory
    ? {
        minHeight: 'calc(100vh - 54px)',
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        background: '#ffffff',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
      }
    : {
        maxWidth: 980,
        margin: '0 auto',
        padding: 24,
        borderRadius: 22,
        border: '1px solid rgba(148, 163, 184, 0.18)',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,250,251,0.98) 100%)',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
      };

  const metaLabel = title?.replace(/^日历\//, '') ?? 'Storybook';
  const storyLabel = storyName ?? 'Preview';

  return { shell, chrome, badge, badgeSubtle, stage, metaLabel, storyLabel, isCalendarStory };
}

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story, context) => {
      if (context.viewMode === 'docs') {
        return createElement(Story);
      }

      const { shell, chrome, badge, badgeSubtle, stage, metaLabel, storyLabel, isCalendarStory } =
        getWorkbenchStyles(context.title, context.name);

      return createElement(
        'div',
        { style: shell },
        createElement(
          'div',
          { style: chrome },
          createElement(
            'div',
            { style: badge },
            createElement('span', null, metaLabel),
            createElement('span', { style: badgeSubtle }, storyLabel)
          ),
          createElement(
            'div',
            {
              style: {
                ...badge,
                padding: '6px 10px',
                fontSize: 11,
                background: 'rgba(255,255,255,0.7)',
              },
            },
            isCalendarStory ? 'Workbench' : 'Component Preview'
          )
        ),
        createElement('div', { style: stage }, createElement(Story))
      );
    },
  ],
};

export default preview;
