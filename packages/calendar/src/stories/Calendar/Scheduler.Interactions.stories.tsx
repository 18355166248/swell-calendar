import type { Meta, StoryObj } from '@storybook/react-vite';

import { Calendar } from '@/components/Calendar';

import {
  Delete,
  DragMoveAndResize,
  InteractionCallbacks,
  KeyboardNavigation,
} from './Scheduler.shared';

const meta = {
  title: '日历/调度器/交互',
  component: Calendar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InteractionCallbacksDemo: Story = {
  ...InteractionCallbacks,
  name: '交互回调',
};

export const DeleteEventDemo: Story = {
  ...Delete,
  name: '删除事件',
};

export const DragMoveAndResizeDemo: Story = {
  ...DragMoveAndResize,
  name: '拖拽移动与调整时长',
};

export const KeyboardNavigationDemo: Story = {
  ...KeyboardNavigation,
  name: '键盘导航',
};
