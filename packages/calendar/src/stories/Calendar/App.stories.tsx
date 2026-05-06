import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarApp } from '@/components/CalendarApp';
import { createCalendarStore } from '@/contexts/calendarStore';
import { createRandomEvents } from './utils/randomEvents';
import DayjsTZDate from '@/time/dayjs-tzdate';

const store = createCalendarStore({ defaultView: 'week' });

function loadEvents() {
  const today = new DayjsTZDate();
  const start = today.addDate(-today.getDay());
  const end = start.addDate(6);
  const events = createRandomEvents(start, end, 30);
  store.getState().calendar.createEvents(events);
}

loadEvents();

const meta = {
  title: 'Calendar/App',
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
