import type { Meta, StoryObj } from '@storybook/react-vite';
import { Day } from '@/components/view/Day';
import { Wrapper } from './Layout/Wrapper';
import { createRandomEvents } from './utils/randomEvents';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventModel } from '@/model/eventModel';

const meta = {
  title: 'Calendar/Day',
  component: Wrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: [],
  argTypes: {},
  args: {
    events: [] as EventModel[],
  },
} satisfies Meta<typeof Day>;

function createTimeGridEvents() {
  const today = new DayjsTZDate();
  const start = today.addDate(-today.getDay());
  const end = start.addDate(1);

  return createRandomEvents(start, end, 4).map((event) => new EventModel(event));
}

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (args) => (
    <Wrapper events={args.events}>
      <Day />
    </Wrapper>
  ),
  args: {
    events: createTimeGridEvents(),
  },
};
