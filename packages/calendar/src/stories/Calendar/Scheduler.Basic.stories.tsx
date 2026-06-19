import type { Meta, StoryObj } from '@storybook/react-vite';

import { Calendar } from '@/components/Calendar';
import { EventObject } from '@/types/events.type';

import {
  ControlledCrud,
  DragTimeTooltipAndOrder,
  RESOURCES,
  SchedulerStoryFrame,
} from './Scheduler.shared';

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

const RANGE_EVENTS: EventObject[] = [
  {
    id: 'range-1',
    title: '需求评审',
    category: 'time',
    start: new Date('2026-06-10T09:00:00'),
    end: new Date('2026-06-10T11:00:00'),
    resourceId: 'r1',
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  {
    id: 'range-2',
    title: '方案评审',
    category: 'time',
    start: new Date('2026-06-11T13:00:00'),
    end: new Date('2026-06-11T15:00:00'),
    resourceId: 'r2',
    backgroundColor: '#10b981',
    color: '#fff',
  },
  {
    id: 'range-3',
    title: '里程碑同步',
    category: 'time',
    start: new Date('2026-06-12T10:00:00'),
    end: new Date('2026-06-12T12:00:00'),
    resourceId: 'r3',
    backgroundColor: '#f59e0b',
    color: '#fff',
  },
];

export const RangeWindowDemo: Story = {
  name: '自定义日期窗口',
  render: () => (
    <SchedulerStoryFrame>
      <Calendar
        events={RANGE_EVENTS}
        options={{
          defaultView: 'scheduler',
          initialDate: '2026-06-10',
          scheduler: {
            resources: RESOURCES,
            hourStart: 8,
            hourEnd: 18,
            range: 3,
          },
        }}
      />
    </SchedulerStoryFrame>
  ),
};
