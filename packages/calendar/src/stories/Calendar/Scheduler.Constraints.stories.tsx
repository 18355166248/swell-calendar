import type { Meta, StoryObj } from '@storybook/react-vite';

import { Calendar } from '@/components/Calendar';

import {
  BlockedTimes,
  BufferTimes,
  Invalid,
  InvalidAndColors,
  OverlapPolicy,
  ResourceVisibilityAndGrouping,
  SharedEvents,
  VisibleResourceIds,
} from './Scheduler.shared';

const meta = {
  title: '日历/调度器/约束与资源',
  component: Calendar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BlockedTimesDemo: Story = {
  ...BlockedTimes,
  name: '禁止时段',
};

export const InvalidTimesDemo: Story = {
  ...Invalid,
  name: '无效时段',
};

export const InvalidAndColorsDemo: Story = {
  ...InvalidAndColors,
  name: '无效时段与背景区段',
};

export const OverlapPolicyDemo: Story = {
  ...OverlapPolicy,
  name: '重叠策略',
};

export const BufferTimesDemo: Story = {
  ...BufferTimes,
  name: '缓冲时间',
};

export const VisibleResourcesDemo: Story = {
  ...VisibleResourceIds,
  name: '可见资源过滤',
};

export const ResourceGroupingDemo: Story = {
  ...ResourceVisibilityAndGrouping,
  name: '资源显隐与分组',
};

export const SharedEventsDemo: Story = {
  ...SharedEvents,
  name: '共享事件',
};
