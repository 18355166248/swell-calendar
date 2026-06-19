import '../src/css/index.scss';
import '../src/stories/showcase.css';

import type { Preview } from '@storybook/react-vite';
import { createElement, type CSSProperties } from 'react';

import { storybookTheme } from '../src/stories/showcase';

function getWorkbenchStyles(title?: string) {
  const isCalendarStory = title?.startsWith('日历/') ?? false;

  const shell: CSSProperties = {
    boxSizing: 'border-box',
    padding: isCalendarStory ? '18px' : '28px 18px',
    background:
      'radial-gradient(circle at top left, rgba(201, 111, 59, 0.18), transparent 24%), radial-gradient(circle at top right, rgba(32, 76, 72, 0.14), transparent 22%), linear-gradient(180deg, #f5eee2 0%, #ebe1d2 100%)',
    ...(isCalendarStory
      ? ({
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
        } as const)
      : { minHeight: '100vh' }),
  };

  const stage: CSSProperties = isCalendarStory
    ? {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        border: `1px solid ${storybookTheme.borderColor}`,
        background:
          'linear-gradient(180deg, rgba(255,252,247,0.95) 0%, rgba(249,243,233,0.88) 100%)',
        boxShadow: '0 36px 80px rgba(58, 38, 22, 0.14)',
      }
    : {
        maxWidth: 1180,
        margin: '0 auto',
        padding: 28,
        borderRadius: 28,
        border: `1px solid ${storybookTheme.borderColor}`,
        background:
          'linear-gradient(180deg, rgba(255, 252, 247, 0.98) 0%, rgba(248, 240, 229, 0.98) 100%)',
        boxShadow: '0 32px 72px rgba(58, 38, 22, 0.12)',
      };

  return {
    shell,
    stage,
  };
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
    options: {
      storySort: {
        order: [
          'Swell Calendar',
          ['概览'],
          '日历',
          [
            '视图',
            ['日视图', '周视图', '月视图', '时间线'],
            '调度器',
            ['基础', '交互', '高级能力', '回归测试'],
            '应用示例',
          ],
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      if (context.viewMode === 'docs') {
        return createElement('div', { className: 'sb-showcase-docs-shell' }, createElement(Story));
      }

      const { shell, stage } = getWorkbenchStyles(context.title);

      return createElement(
        'div',
        { style: shell },
        createElement('div', { style: stage }, createElement(Story))
      );
    },
  ],
};

export default preview;
