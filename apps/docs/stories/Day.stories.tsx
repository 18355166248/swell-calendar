import type { Meta, StoryObj } from '@storybook/react';
import { Day } from 'swell-calendar/Day';

const meta: Meta<typeof Day> = {
  component: Day,
  argTypes: {
    type: {
      control: { type: 'radio' },
      options: ['button', 'submit', 'reset'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Day>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {
  render: (props) => (
    <Day
      {...props}
      onClick={(): void => {
        // eslint-disable-next-line no-alert -- alert for demo
        alert('Hello Swell Calendar!');
      }}
    />
  ),
  name: 'Day',
  args: {
    children: 'Hello',
    type: 'button',
    style: {
      color: 'blue',
      border: '1px solid gray',
      padding: 10,
      borderRadius: 10,
    },
  },
};
