import type { Meta, StoryObj } from '@storybook/react-vite';

import { Calendar } from '@/components/Calendar';

import {
  CrossInstanceDnD,
  ExternalDnDMock,
  Recurrence,
  RecurrenceEditScope,
  Timezone,
} from './Scheduler.shared';

const meta = {
  title: '日历/调度器/高级能力',
  component: Calendar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RecurrenceDemo: Story = {
  ...Recurrence,
  name: '重复事件展开',
};

export const TimezoneDemo: Story = {
  ...Timezone,
  name: '时区渲染',
};

export const ExternalDnDDemo: Story = {
  ...ExternalDnDMock,
  name: '外部拖入模拟',
};

export const CrossInstanceDnDDemo: Story = {
  ...CrossInstanceDnD,
  name: '跨实例拖拽',
};

export const RecurrenceEditScopeDemo: Story = {
  ...RecurrenceEditScope,
  name: '重复事件编辑作用域',
};
