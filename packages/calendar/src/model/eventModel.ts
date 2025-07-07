import DayjsTZDate from '@/time/dayjs-tzdate';
import { DateType, EventCategory, EventObject } from '@/types/events.type';
import { stamp } from '@/utils/stamp';

export class EventModel implements EventObject {
  id = '';
  title = '';
  start: DateType = new DayjsTZDate();
  end: DateType = new DayjsTZDate();
  isAllday = false;
  /** 事件类别：time(时间事件)、allday(全天事件)、milestone(里程碑)、task(任务) */
  category: EventCategory = 'time';
  isVisible = true;

  constructor(public event: EventObject) {
    stamp(this);

    this.init(event);
  }

  init({
    id = '',
    title = '',
    start = new DayjsTZDate(),
    end = new DayjsTZDate(),
    isAllday = false,
    category = 'time',
  }: EventObject) {
    this.id = id;
    this.title = title;
    this.start = start;
    this.end = end;
    this.isAllday = category === 'allday' || isAllday;
    this.category = category;
  }

  /**
   * 获取实例的唯一ID
   * @returns {number} 唯一标识符
   */
  cid(): number {
    return stamp(this);
  }
}
