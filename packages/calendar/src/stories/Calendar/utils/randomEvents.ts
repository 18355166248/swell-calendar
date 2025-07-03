import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';
import Chance from 'chance';

const chance = new Chance();

let id = 1;

function createTime(event: EventObject, start: DayjsTZDate, end: DayjsTZDate) {
  const startDate = start.dayjs.clone().add(4, 'hour');
  const endDate = end.dayjs.clone().add(8, 'hour');

  event.start = startDate.toDate();
  event.end = endDate.toDate();
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
