import type { Meta, StoryObj } from '@storybook/react-vite';

import { Calendar } from '@/components/Calendar';

import { CrossInstanceDnD, ExternalDnDMock } from './Scheduler.shared';

const meta = {
  title: '日历/调度器/高级能力',
  component: Calendar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ExternalDnDDemo: Story = {
  ...ExternalDnDMock,
  name: '外部拖入模拟',
};

export const CrossInstanceDnDDemo: Story = {
  ...CrossInstanceDnD,
  name: '跨实例拖拽',
};
