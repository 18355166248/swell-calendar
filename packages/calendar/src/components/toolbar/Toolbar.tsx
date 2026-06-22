import { useCalendarStore } from '@/contexts/calendarStore';
import { cls } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { formatDateWindowText, getVisibleDateWindow, normalizeRange } from '@/time/view-range';
import { Options, ViewType } from '@/types/options.type';
import { NavigateDirection } from '@/types/view.type';

const VIEW_LABELS: Record<ViewType, string> = {
  day: '日',
  week: '周',
  month: '月',
  agenda: '列表',
  scheduler: '调度',
  timeline: '时间线',
};

const VIEW_ORDER: ViewType[] = ['day', 'week', 'month', 'agenda', 'scheduler', 'timeline'];

function getDateRangeText(view: ViewType, renderDate: DayjsTZDate, options: Options): string {
  const d = renderDate.dayjs;
  if (view === 'day') {
    return d.format('YYYY年M月D日');
  }
  if (view === 'month') {
    return d.format('YYYY年M月');
  }
  if (view === 'agenda') {
    const range = normalizeRange(options.agenda?.range) ?? 14;
    return formatDateWindowText(getVisibleDateWindow(renderDate, range));
  }
  if (view === 'timeline') {
    const timelineRange = normalizeRange(options.timeline?.range);
    if (timelineRange) {
      return formatDateWindowText(getVisibleDateWindow(renderDate, timelineRange));
    }
    return d.format('YYYY年M月');
  }
  if (view === 'scheduler') {
    const schedulerRange = normalizeRange(options.scheduler?.range);
    if (schedulerRange) {
      return formatDateWindowText(
        getVisibleDateWindow(
          renderDate,
          schedulerRange,
          options.scheduler?.workweek ?? options.week?.workweek ?? false
        )
      );
    }
  }
  // week / scheduler default
  const startOfWeek = d.startOf('week');
  const endOfWeek = d.endOf('week');
  const sameMonth = startOfWeek.month() === endOfWeek.month();
  if (sameMonth) {
    return `${startOfWeek.format('YYYY年M月D日')} - ${endOfWeek.format('D日')}`;
  }
  return `${startOfWeek.format('YYYY年M月D日')} - ${endOfWeek.format('M月D日')}`;
}

export function Toolbar() {
  const currentView = useCalendarStore((s) => s.view.currentView);
  const renderDate = useCalendarStore((s) => s.view.renderDate);
  const visibleViews = useCalendarStore((s) => s.options.views);
  const options = useCalendarStore((s) => s.options);
  const setView = useCalendarStore((s) => s.view.setView);
  const navigate = useCalendarStore((s) => s.view.navigate);
  const goToToday = useCalendarStore((s) => s.view.goToToday);

  const dateText = getDateRangeText(currentView, renderDate, options);

  const handleNavigate = (dir: NavigateDirection) => () => navigate(dir);

  return (
    <div className={cls('toolbar')}>
      <div className={cls('toolbar-nav')}>
        <button
          type="button"
          className={cls('toolbar-btn', 'toolbar-btn-nav')}
          onClick={handleNavigate('prev')}
          aria-label="上一页"
        >
          &#8249;
        </button>
        <button
          type="button"
          className={cls('toolbar-btn', 'toolbar-btn-today')}
          onClick={goToToday}
        >
          今天
        </button>
        <button
          type="button"
          className={cls('toolbar-btn', 'toolbar-btn-nav')}
          onClick={handleNavigate('next')}
          aria-label="下一页"
        >
          &#8250;
        </button>
      </div>

      <div className={cls('toolbar-date')}>{dateText}</div>

      <div className={cls('toolbar-views')}>
        {VIEW_ORDER.filter((v) => visibleViews[v]).map((v) => (
          <button
            key={v}
            type="button"
            className={cls('toolbar-btn', 'toolbar-btn-view', {
              [`toolbar-btn-view-active`]: v === currentView,
            })}
            onClick={() => setView(v)}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}
