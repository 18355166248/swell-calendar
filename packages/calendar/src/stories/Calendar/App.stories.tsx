import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';

import { CalendarApp } from '@/components/CalendarApp';
import { createCalendarStore } from '@/contexts/calendarStore';
import DayjsTZDate from '@/time/dayjs-tzdate';

import { createRandomEvents } from './utils/randomEvents';

function createStore(defaultView = 'week') {
  return createCalendarStore({ defaultView: defaultView as 'week' | 'timeline' });
}

function loadWeekEvents(store: ReturnType<typeof createCalendarStore>) {
  const today = new DayjsTZDate();
  const start = today.addDate(-today.getDay());
  const end = start.addDate(6);
  const events = createRandomEvents(start, end, 30);
  store.getState().calendar.createEvents(events);
}

function makeTimelineEvents() {
  const today = dayjs();
  const resources = [
    { id: 'r1', name: '张三', backgroundColor: '#3b82f6', color: '#fff' },
    { id: 'r2', name: '李四', backgroundColor: '#10b981', color: '#fff' },
    { id: 'r3', name: '王五', backgroundColor: '#f59e0b', color: '#fff' },
  ];

  return {
    events: [
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
    ],
    resources,
  };
}

const weekStore = createStore('week');
loadWeekEvents(weekStore);

const meta = {
  title: '日历/应用示例',
  component: CalendarApp,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CalendarApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '周视图整页应用',
  args: {
    store: weekStore,
  },
  render: () => (
    <div style={{ position: 'absolute', inset: 0 }}>
      <CalendarApp store={weekStore} />
    </div>
  ),
};

export const Timeline: Story = {
  name: '时间线整页应用',
  args: {
    store: weekStore,
  },
  render: () => {
    const { events, resources } = makeTimelineEvents();
    const store = createCalendarStore({
      defaultView: 'timeline',
      timeline: { resources, hourStart: 8, hourEnd: 18 },
    });
    store.getState().calendar.createEvents(events);

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <CalendarApp store={store} />
      </div>
    );
  },
};
