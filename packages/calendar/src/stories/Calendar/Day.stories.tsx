import type { Meta, StoryObj } from '@storybook/react-vite';

import { Day } from '@/components/view/Day';
import { Wrapper } from './Layout/Wrapper';

const meta = {
  title: 'Calendar/Day',
  component: Day,
  parameters: {
    layout: 'fullscreen',
  },
  tags: [],
  argTypes: {},
  args: {},
} satisfies Meta<typeof Day>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (args) => (
    <Wrapper>
      <Day {...args} />
    </Wrapper>
  ),
  args: {},
};
