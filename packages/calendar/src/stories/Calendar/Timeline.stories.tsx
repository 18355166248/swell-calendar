import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import { Calendar } from '@/components/Calendar';
import { Timeline } from '@/components/view/Timeline';
import { EventModel } from '@/model/eventModel';
import { CalendarCallbacks } from '@/types/callbacks.type';
import { EventObject } from '@/types/events.type';
import { ResourceInfo } from '@/types/options.type';

import { Wrapper } from './Layout/Wrapper';

const meta = {
  title: '日历/视图/时间线',
  component: Wrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: [],
  argTypes: {},
  args: {
    events: [] as EventModel[],
  },
} satisfies Meta<typeof Timeline>;

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
 * 当月内的日粒度排程事件：包含跨多天横条与同资源行内重叠（车道堆叠）。
 */
function makeTimelineEvents() {
  return [
    // r1：一条跨 5 天 + 同一天两个事件（车道堆叠）
    {
      id: 't-1',
      title: '项目冲刺',
      category: 'time' as const,
      resourceId: 'r1',
      start: dayOfMonth(2, 9),
      end: dayOfMonth(6, 18),
      backgroundColor: '#3b82f6',
      color: '#fff',
    },
    {
      id: 't-2',
      title: '团队会议',
      category: 'time' as const,
      resourceId: 'r1',
      start: dayOfMonth(9, 10),
      end: dayOfMonth(9, 11),
      backgroundColor: '#3b82f6',
      color: '#fff',
    },
    {
      id: 't-3',
      title: '代码评审',
      category: 'time' as const,
      resourceId: 'r1',
      start: dayOfMonth(9, 14),
      end: dayOfMonth(10, 15),
      backgroundColor: '#6366f1',
      color: '#fff',
    },
    // r2：一条长跨度横条 + 一个单日
    {
      id: 't-4',
      title: '客户驻场',
      category: 'time' as const,
      resourceId: 'r2',
      start: dayOfMonth(4, 9),
      end: dayOfMonth(11, 17),
      backgroundColor: '#10b981',
      color: '#fff',
    },
    {
      id: 't-5',
      title: '周报撰写',
      category: 'time' as const,
      resourceId: 'r2',
      start: dayOfMonth(15, 15),
      end: dayOfMonth(15, 16),
      backgroundColor: '#10b981',
      color: '#fff',
    },
    // r3：相邻多日 + 同日重叠
    {
      id: 't-6',
      title: '新人培训',
      category: 'time' as const,
      resourceId: 'r3',
      start: dayOfMonth(8, 9),
      end: dayOfMonth(9, 17),
      backgroundColor: '#f59e0b',
      color: '#fff',
    },
    {
      id: 't-7',
      title: '版本发布',
      category: 'time' as const,
      resourceId: 'r3',
      start: dayOfMonth(16, 10),
      end: dayOfMonth(16, 12),
      backgroundColor: '#f59e0b',
      color: '#fff',
    },
    {
      id: 't-8',
      title: '发布复盘',
      category: 'time' as const,
      resourceId: 'r3',
      start: dayOfMonth(16, 14),
      end: dayOfMonth(16, 15),
      backgroundColor: '#ef4444',
      color: '#fff',
    },
  ].map((event) => new EventModel(event));
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
 * Primary — 基础渲染（静态）
 *
 * 3 个资源 × 当月按天列的日粒度时间轴，含跨多天横条与同资源行内重叠的车道堆叠。
 * 仅展示渲染，不接回调 → 不可拖拽；交互演示见「受控拖拽与 resize」。
 */
export const Primary: Story = {
  name: '基础视图',
  render: (args) => (
    <Wrapper
      events={args.events}
      options={{
        timeline: {
          resources: makeResources(),
        },
      }}
    >
      <Timeline />
    </Wrapper>
  ),
  args: {
    events: makeTimelineEvents(),
  },
};

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
