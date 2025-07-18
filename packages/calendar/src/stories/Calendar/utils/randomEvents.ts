import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';
import Chance from 'chance';

const chance = new Chance();

let id = 1;

const mockTimeGridEvents = [
  {
    start: new DayjsTZDate('2025-07-15 04:30:00'),
    end: new DayjsTZDate('2025-07-15 08:30:00'),
  },
  {
    start: new DayjsTZDate('2025-07-15 03:30:00'),
    end: new DayjsTZDate('2025-07-15 06:30:00'),
  },
  {
    start: new DayjsTZDate('2025-07-15 07:30:00'),
    end: new DayjsTZDate('2025-07-15 09:30:00'),
  },
  {
    start: new DayjsTZDate('2025-07-15 04:00:00'),
    end: new DayjsTZDate('2025-07-15 05:00:00'),
  },

  {
    start: new DayjsTZDate('2025-07-15 10:30:00'),
    end: new DayjsTZDate('2025-07-15 11:30:00'),
  },
  {
    start: new DayjsTZDate('2025-07-15 12:30:00'),
    end: new DayjsTZDate('2025-07-15 13:30:00'),
    isAllday: true,
  },
  {
    start: new DayjsTZDate('2025-07-31 01:30:00'),
    end: new DayjsTZDate('2025-07-31 02:30:00'),
  },
];
let num = 0;

function createTime(event: EventObject, start: DayjsTZDate, end: DayjsTZDate) {
  event.start = mockTimeGridEvents[num].start;
  event.end = mockTimeGridEvents[num].end;
  event.isAllday = mockTimeGridEvents[num].isAllday || false;
  num++;
  if (event.isAllday) {
    event.category = 'allday';
  }
  if (num >= mockTimeGridEvents.length) {
    num = 0;
  }
}

function createRandomEvent({ start, end }: { start: DayjsTZDate; end: DayjsTZDate }): EventObject {
  const event: EventObject = {
    id: `event-${id++}`,
    title: chance.sentence({ words: 4 }),
    category: 'time',
  };

  createTime(event, start, end);

  return event;
}

export function createRandomEvents(
  start: DayjsTZDate,
  end: DayjsTZDate,
  count: number
): EventObject[] {
  return Array.from({ length: count }, () => createRandomEvent({ start, end }));
}
