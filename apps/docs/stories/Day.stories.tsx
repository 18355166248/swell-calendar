// eslint-disable-next-line storybook/no-renderer-packages
import type { Meta, StoryObj } from '@storybook/react';
import { Day, DayProps } from 'swell-calendar/Day';

function DayView(props: DayProps) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Day {...props}></Day>
    </div>
  );
}

const meta: Meta<typeof Day> = {
  component: DayView,
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
  render: (props) => <DayView {...props} />,
  name: 'Primary',
  args: {
    style: {},
    children: 'Day',
  },
};

export const Primary1: Story = {
  render: (props) => <DayView {...props} />,
  name: 'Primary1',
  args: {
    style: {},
    children: 'Day',
  },
};
