import type { Meta, StoryObj } from '@storybook/react';
import { TimeGrid } from 'swell-calendar/TimeGrid';

const meta: Meta<typeof TimeGrid> = {
  component: TimeGrid,
  argTypes: {
    type: {
      control: { type: 'radio' },
      options: ['button', 'submit', 'reset'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof TimeGrid>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {
  render: (props) => <TimeGrid />,
  name: 'TimeGrid',
  args: {
    style: {},
  },
};
