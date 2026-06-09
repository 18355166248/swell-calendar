import type { Meta, StoryObj } from '@storybook/react-vite';

import { Calendar } from '@/components/Calendar';

import { ControlledCrud, DragTimeTooltipAndOrder } from './Scheduler.shared';

const meta = {
  title: '日历/调度器/基础',
  component: Calendar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ControlledCrudDemo: Story = {
  ...ControlledCrud,
  name: '受控增删改',
};

export const DragTooltipAndOrderDemo: Story = {
  ...DragTimeTooltipAndOrder,
  name: '时间提示与排序',
};
