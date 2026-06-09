import type { Meta, StoryObj } from '@storybook/react-vite';

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
