import type { Meta, StoryObj } from '@storybook/react-vite';

import { Calendar } from '@/components/Calendar';

import {
  AllDayAndMultiDay,
  ControlledCrud,
  Default,
  DragTimeTooltipAndOrder,
  Templates,
} from './Scheduler.shared';

const meta = {
  title: '日历/调度器/基础',
  component: Calendar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultView: Story = {
  ...Default,
  name: '基础视图',
};

export const ControlledCrudDemo: Story = {
  ...ControlledCrud,
  name: '受控增删改',
};

export const AllDayAndMultiDayDemo: Story = {
  ...AllDayAndMultiDay,
  name: '全天与跨天事件',
};

export const DragTooltipAndOrderDemo: Story = {
  ...DragTimeTooltipAndOrder,
  name: '时间提示与排序',
};

export const TemplateRendering: Story = {
  ...Templates,
  name: '模板渲染',
};
