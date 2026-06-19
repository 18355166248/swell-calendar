import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import { Calendar } from '@/components/Calendar';
import { CalendarCallbacks } from '@/types/callbacks.type';
import { EventObject } from '@/types/events.type';
import { ResourceInfo } from '@/types/options.type';

const meta = {
  title: '日历/视图/时间线',
  component: Calendar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: [],
  argTypes: {},
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 创建基础资源列表 */
function makeResources(): ResourceInfo[] {
  return [
    { id: 'r1', name: '张三', backgroundColor: '#3b82f6' },
    { id: 'r2', name: '李四', backgroundColor: '#10b981' },
    { id: 'r3', name: '王五', backgroundColor: '#f59e0b' },
  ];
}

/** 当月第 n 天（1-based）的某点 */
function dayOfMonth(n: number, hour = 9) {
  return dayjs()
    .startOf('month')
    .add(n - 1, 'day')
    .hour(hour)
    .minute(0)
    .toDate();
}

/**
 * 受控故事用的纯事件对象（不包成 EventModel）：
 * 宿主用 useState 持有，move / resize / create 经回调写回，才能看到横条真的动。
 */
function makeControlledTimelineEvents(): EventObject[] {
  return [
    {
      id: 'tc-1',
      title: '项目冲刺（可拖）',
      category: 'time',
      resourceId: 'r1',
      start: dayOfMonth(2, 9),
      end: dayOfMonth(6, 18),
      backgroundColor: '#3b82f6',
      color: '#fff',
    },
    {
      id: 'tc-2',
      title: '客户驻场（可左右 resize）',
      category: 'time',
      resourceId: 'r2',
      start: dayOfMonth(4, 9),
      end: dayOfMonth(9, 17),
      backgroundColor: '#10b981',
      color: '#fff',
    },
    {
      id: 'tc-3',
      title: '版本发布',
      category: 'time',
      resourceId: 'r3',
      start: dayOfMonth(12, 10),
      end: dayOfMonth(13, 12),
      backgroundColor: '#f59e0b',
      color: '#fff',
    },
  ];
}

/**
 * ControlledDragResize — 受控拖拽 / resize / 创建
 *
 * timeline 是宿主受控的：组件只发交互意图，最终以 props.events 为准。
 * 本故事用 useState 持有事件并在回调里写回，演示横条真的会移动 / 伸缩 / 新建：
 * - 拖横条主体 → 改天（含跨资源行）
 * - 拖横条左 / 右边手柄 → 改起 / 止天
 * - 空白行横拖 → 新建跨天全天事件
 * - 拖拽中按 ESC → 取消，横条回到原位
 */
export const ControlledDragResize: Story = {
  name: '受控拖拽与 resize',
  render: function ControlledDragResizeStory() {
    const [events, setEvents] = useState<EventObject[]>(() => makeControlledTimelineEvents());
    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventUpdate: ({ event, previousEvent }) => {
          setEvents((current) =>
            current.map((item) => (item.id === previousEvent.id ? { ...item, ...event } : item))
          );
        },
        onEventCreate: ({ event }) => {
          setEvents((current) => [
            ...current,
            {
              ...event,
              id: `tc-created-${current.length + 1}`,
              title: event.title || '新建排程',
              backgroundColor: '#6366f1',
              color: '#fff',
            },
          ]);
        },
      }),
      []
    );

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'timeline',
            timeline: {
              resources: makeResources(),
            },
          }}
        />
      </div>
    );
  },
};

const RANGE_EVENTS: EventObject[] = [
  {
    id: 'timeline-range-1',
    title: '设计冲刺',
    category: 'time',
    resourceId: 'r1',
    start: new Date('2026-06-10T09:00:00'),
    end: new Date('2026-06-12T18:00:00'),
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  {
    id: 'timeline-range-2',
    title: '联调窗口',
    category: 'time',
    resourceId: 'r2',
    start: new Date('2026-06-11T10:00:00'),
    end: new Date('2026-06-14T17:00:00'),
    backgroundColor: '#10b981',
    color: '#fff',
  },
  {
    id: 'timeline-range-3',
    title: '验收发布',
    category: 'time',
    resourceId: 'r3',
    start: new Date('2026-06-13T09:00:00'),
    end: new Date('2026-06-14T12:00:00'),
    backgroundColor: '#f59e0b',
    color: '#fff',
  },
];

export const RangeWindow: Story = {
  name: '自定义日期窗口',
  render: () => (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Calendar
        events={RANGE_EVENTS}
        options={{
          defaultView: 'timeline',
          initialDate: '2026-06-10',
          timeline: {
            resources: makeResources(),
            range: 5,
          },
        }}
      />
    </div>
  ),
};
