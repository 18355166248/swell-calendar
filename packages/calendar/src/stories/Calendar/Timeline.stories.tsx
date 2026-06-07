import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';

import { Timeline } from '@/components/view/Timeline';
import { EventModel } from '@/model/eventModel';
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
 * Primary — 基础渲染
 *
 * 3 个资源 × 当月按天列的日粒度时间轴。
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
 * WithEvents — 多日横条与重叠堆叠
 *
 * 验证跨多天事件渲染为横条，同资源行内重叠事件按车道纵向堆叠、行高自适应。
 */
export const WithEvents: Story = {
  name: '多日横条与重叠',
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
