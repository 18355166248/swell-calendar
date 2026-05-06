import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from '@/components/Calendar';
import { CalendarCallbacks } from '@/types/callbacks.type';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';
import { useMemo, useState } from 'react';
import Chance from 'chance';
import dayjs from 'dayjs';

const chance = new Chance();

const RESOURCES = [
  { id: 'r1', name: '会议室 A', backgroundColor: '#3b82f6', color: '#fff' },
  { id: 'r2', name: '会议室 B', backgroundColor: '#10b981', color: '#fff' },
  { id: 'r3', name: '张三', backgroundColor: '#f59e0b', color: '#fff' },
  { id: 'r4', name: '李四', backgroundColor: '#ef4444', color: '#fff' },
  { id: 'r5', name: '王五', backgroundColor: '#8b5cf6', color: '#fff' },
];

function createSchedulerEvents(): EventObject[] {
  const today = new DayjsTZDate();
  const weekStart = today.addDate(-today.getDay());
  const events: EventObject[] = [];
  let id = 1;

  RESOURCES.forEach((resource) => {
    for (let i = 0; i < 6; i++) {
      const dayOffset = chance.integer({ min: 0, max: 6 });
      const startHour = chance.integer({ min: 8, max: 18 });
      const duration = chance.integer({ min: 1, max: 3 });

      const start = dayjs(weekStart.getTime()).add(dayOffset, 'day').hour(startHour).minute(0);
      const end = start.add(duration, 'hour');

      events.push({
        id: `sched-${id++}`,
        title: chance.sentence({ words: 3 }),
        category: 'time',
        start: start.toDate(),
        end: end.toDate(),
        resourceId: resource.id,
        backgroundColor: resource.backgroundColor,
        color: resource.color,
      });
    }
  });

  return events;
}

function getTimeValue(value: EventObject['start']) {
  if (!value) {
    return 0;
  }

  if (typeof value === 'number' || typeof value === 'string' || value instanceof Date) {
    return new Date(value).getTime();
  }

  return value.getTime();
}

function hasOverlap(events: EventObject[], targetEvent: EventObject, previousEventId?: string) {
  const targetResourceId = targetEvent.resourceId ?? targetEvent.resourceIds?.[0];
  const targetStart = getTimeValue(targetEvent.start);
  const targetEnd = getTimeValue(targetEvent.end);

  return events.some((event) => {
    if (event.id === previousEventId) {
      return false;
    }

    const eventResourceId = event.resourceId ?? event.resourceIds?.[0];

    if (!targetResourceId || eventResourceId !== targetResourceId) {
      return false;
    }

    const eventStart = getTimeValue(event.start);
    const eventEnd = getTimeValue(event.end);

    return targetStart < eventEnd && targetEnd > eventStart;
  });
}

const meta = {
  title: 'Calendar/Scheduler',
  component: Calendar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Calendar
        events={createSchedulerEvents()}
        options={{
          defaultView: 'scheduler',
          scheduler: {
            resources: RESOURCES,
            hourStart: 8,
            hourEnd: 20,
          },
        }}
      />
    </div>
  ),
};

export const ControlledCrud: Story = {
  render: function ControlledCrudStory() {
    const [events, setEvents] = useState<EventObject[]>(() => createSchedulerEvents());
    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventCreate: ({ event }) => {
          const resourceId = event.resourceId ?? event.resourceIds?.[0];
          const resource = RESOURCES.find((item) => item.id === resourceId);

          setEvents((current) => [
            ...current,
            {
              ...event,
              id: `sched-created-${current.length + 1}`,
              title: event.title || '新建预约',
              backgroundColor: resource?.backgroundColor ?? '#0f766e',
              color: resource?.color ?? '#fff',
            },
          ]);
        },
        onEventUpdate: ({ event, previousEvent }) => {
          setEvents((current) =>
            current.map((item) =>
              item.id === previousEvent.id
                ? {
                    ...item,
                    ...event,
                  }
                : item
            )
          );
        },
        onValidateEventChange: ({ event, previousEvent }) => {
          return !hasOverlap(events, event, previousEvent?.id);
        },
      }),
      [events]
    );

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'scheduler',
            scheduler: {
              resources: RESOURCES,
              hourStart: 8,
              hourEnd: 20,
            },
          }}
        />
      </div>
    );
  },
};
