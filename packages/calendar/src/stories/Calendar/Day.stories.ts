import type { Meta, StoryObj } from '@storybook/react-vite';

import { Day } from '@/components/view/Day';

const meta = {
  title: 'Calendar/Day',
  component: Day,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {},
} satisfies Meta<typeof Day>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
};
