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
  const start = new DayjsTZDate();
  const end = start.setHours(23, 59, 59, 999);

  return createRandomEvents(start, end, 10).map((event) => new EventModel(event));
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
