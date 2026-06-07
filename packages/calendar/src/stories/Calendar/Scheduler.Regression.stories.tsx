import type { Meta, StoryObj } from '@storybook/react-vite';

import { Calendar } from '@/components/Calendar';

import { DragResizePointerRegression, DragResizeRegression } from './Scheduler.shared';

const meta = {
  title: '日历/调度器/回归测试',
  id: 'calendar-scheduler-regression',
  component: Calendar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DragResizeRegressionDemo: Story = {
  ...DragResizeRegression,
  name: '拖拽与调整回归',
};

export const DragResizePointerRegressionDemo: Story = {
  ...DragResizePointerRegression,
  name: '真实指针回归',
};
