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

/** 创建时间线事件 */
function makeTimelineEvents() {
  const today = dayjs();
  return [
    {
      id: 't-1',
      title: '团队会议',
      category: 'time' as const,
      resourceId: 'r1',
      start: today.hour(9).minute(0).toDate(),
      end: today.hour(10).minute(30).toDate(),
      backgroundColor: '#3b82f6',
      color: '#fff',
    },
    {
      id: 't-2',
      title: '代码评审',
      category: 'time' as const,
      resourceId: 'r1',
      start: today.hour(14).minute(0).toDate(),
      end: today.hour(15).minute(0).toDate(),
      backgroundColor: '#3b82f6',
      color: '#fff',
    },
    {
      id: 't-3',
      title: '客户拜访',
      category: 'time' as const,
      resourceId: 'r2',
      start: today.hour(10).minute(0).toDate(),
      end: today.hour(12).minute(0).toDate(),
      backgroundColor: '#10b981',
      color: '#fff',
    },
    {
      id: 't-4',
      title: '周报撰写',
      category: 'time' as const,
      resourceId: 'r2',
      start: today.hour(15).minute(0).toDate(),
      end: today.hour(16).minute(30).toDate(),
      backgroundColor: '#10b981',
      color: '#fff',
    },
    {
      id: 't-5',
      title: '项目规划',
      category: 'time' as const,
      resourceId: 'r3',
      start: today.hour(9).minute(0).toDate(),
      end: today.hour(11).minute(0).toDate(),
      backgroundColor: '#f59e0b',
      color: '#fff',
    },
    {
      id: 't-6',
      title: '复盘会议',
      category: 'time' as const,
      resourceId: 'r3',
      start: today.hour(16).minute(0).toDate(),
      end: today.hour(17).minute(30).toDate(),
      backgroundColor: '#f59e0b',
      color: '#fff',
    },
  ].map((event) => new EventModel(event));
}

/**
 * Primary — 基础渲染
 *
 * 3 个资源 × 8 小时（9:00-17:00）横向时间轴
 */
export const Primary: Story = {
  name: '基础视图',
  render: (args) => (
    <Wrapper
      events={args.events}
      options={{
        timeline: {
          resources: makeResources(),
          hourStart: 9,
          hourEnd: 17,
        },
      }}
    >
      <Timeline />
    </Wrapper>
  ),
  args: {
    events: [],
  },
};

/**
 * WithEvents — 事件渲染
 *
 * 每个资源列 2 个时间事件，验证事件卡片在时间轴上的正确渲染
 */
export const WithEvents: Story = {
  name: '带事件数据',
  render: (args) => (
    <Wrapper
      events={args.events}
      options={{
        timeline: {
          resources: makeResources(),
          hourStart: 8,
          hourEnd: 18,
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
 * WithColorsAndInvalid — 背景色区段和禁止时段
 *
 * 验证 `colors` 背景区段和 `blockedTimes` 禁止时段的渲染。
 */
export const WithColorsAndInvalid: Story = {
  name: '背景区段与禁用时段',
  render: (args) => (
    <Wrapper
      events={args.events}
      options={{
        timeline: {
          resources: makeResources(),
          hourStart: 8,
          hourEnd: 18,
          colors: [
            {
              start: dayjs().hour(12).minute(0).toDate(),
              end: dayjs().hour(13).minute(0).toDate(),
              background: '#fef3c7',
              color: '#92400e',
            },
          ],
          blockedTimes: [
            {
              start: dayjs().hour(8).minute(0).toDate(),
              end: dayjs().hour(9).minute(0).toDate(),
              resourceId: 'r2',
            },
          ],
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
