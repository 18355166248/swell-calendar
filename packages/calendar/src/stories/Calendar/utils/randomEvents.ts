import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';
import Chance from 'chance';
import dayjs from 'dayjs';

const chance = new Chance();

const currDayString = dayjs().format('YYYY-MM-DD');

let id = 1;

const mockTimeGridEvents = [
  {
    start: new DayjsTZDate(`${currDayString} 04:30:00`),
    end: new DayjsTZDate(`${currDayString} 08:30:00`),
  },
  {
    start: new DayjsTZDate(`${currDayString} 03:30:00`),
    end: new DayjsTZDate(`${currDayString} 06:30:00`),
  },
  {
    start: new DayjsTZDate(`${currDayString} 07:30:00`),
    end: new DayjsTZDate(`${currDayString} 09:30:00`),
  },
  {
    start: new DayjsTZDate(`${currDayString} 04:00:00`),
    end: new DayjsTZDate(`${currDayString} 05:00:00`),
  },

  {
    start: new DayjsTZDate(`${currDayString} 10:30:00`),
    end: new DayjsTZDate(`${currDayString} 11:30:00`),
  },
  {
    start: new DayjsTZDate(`${currDayString} 12:30:00`),
    end: new DayjsTZDate(`${currDayString} 13:30:00`),
    isAllday: true,
  },
  {
    start: new DayjsTZDate('2025-08-31 01:30:00'),
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
    backgroundColor: chance.color({ format: 'hex' }),
    dragBackgroundColor: chance.color({ format: 'hex' }),
    borderColor: chance.color({ format: 'hex' }),
    color: chance.color({ format: 'hex' }),
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
