import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarApp } from '@/components/CalendarApp';
import { createCalendarStore } from '@/contexts/calendarStore';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';
import Chance from 'chance';
import dayjs from 'dayjs';

const RESOURCES = [
  { id: 'r1', name: '会议室 A', backgroundColor: '#3b82f6', color: '#fff' },
  { id: 'r2', name: '会议室 B', backgroundColor: '#10b981', color: '#fff' },
  { id: 'r3', name: '张三', backgroundColor: '#f59e0b', color: '#fff' },
  { id: 'r4', name: '李四', backgroundColor: '#ef4444', color: '#fff' },
  { id: 'r5', name: '王五', backgroundColor: '#8b5cf6', color: '#fff' },
];

const store = createCalendarStore({
  defaultView: 'scheduler',
  scheduler: {
    resources: RESOURCES,
    hourStart: 8,
    hourEnd: 20,
  },
});

function createSchedulerEvents(): EventObject[] {
  const chance = new Chance();
  const today = new DayjsTZDate();
  const weekStart = today.addDate(-today.getDay());
  const events: EventObject[] = [];
  let id = 1;

  RESOURCES.forEach((resource) => {
    for (let i = 0; i < 6; i++) {
      const dayOffset = chance.integer({ min: 0, max: 6 });
      const startHour = chance.integer({ min: 8, max: 18 });
      const duration = chance.integer({ min: 1, max: 3 });

      const start = dayjs(weekStart.getTime()).add(dayOffset, 'day').hour(startHour).minute(0);
      const end = start.add(duration, 'hour');

      events.push({
        id: `sched-${id++}`,
        title: chance.sentence({ words: 3 }),
        category: 'time',
        start: start.toDate(),
        end: end.toDate(),
        resourceId: resource.id,
        backgroundColor: resource.backgroundColor,
        color: resource.color,
      });
    }
  });

  return events;
}

store.getState().calendar.createEvents(createSchedulerEvents());

const meta = {
  title: 'Calendar/Scheduler',
  component: CalendarApp,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CalendarApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    store,
  },
  render: () => (
    <div style={{ position: 'absolute', inset: 0 }}>
      <CalendarApp store={store} />
    </div>
  ),
};
