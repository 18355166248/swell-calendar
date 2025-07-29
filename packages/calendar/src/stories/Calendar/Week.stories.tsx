import type { Meta, StoryObj } from '@storybook/react-vite';
import { Week } from '@/components/view/Week';
import { Wrapper } from './Layout/Wrapper';
import { createRandomEvents } from './utils/randomEvents';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventModel } from '@/model/eventModel';
import { Day } from '@/time/datetime';

const meta = {
  title: 'Calendar/Week',
  component: Wrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: [],
  argTypes: {},
  args: {
    events: [] as EventModel[],
  },
} satisfies Meta<typeof Week>;

function createTimeGridEvents() {
  const today = new DayjsTZDate();
  const start = today.addDate(-today.getDay());
  const end = start.addDate(1);

  return createRandomEvents(start, end, 7).map((event) => new EventModel(event));
}

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (args) => (
    <Wrapper
      events={args.events}
      options={{
        week: {
          startDayOfWeek: Day.MON,
          // workweek: true,
        },
      }}
    >
      <Week />
    </Wrapper>
  ),
  args: {
    events: createTimeGridEvents(),
  },
};

export const Workweek: Story = {
  render: (args) => (
    <Wrapper
      events={args.events}
      options={{
        week: {
          startDayOfWeek: Day.MON,
          workweek: true,
        },
      }}
    >
      <Week />
    </Wrapper>
  ),
  args: {
    events: createTimeGridEvents(),
  },
};
