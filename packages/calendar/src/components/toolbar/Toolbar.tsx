import { useCalendarStore } from '@/contexts/calendarStore';
import { cls } from '@/helpers/css';
import { ViewType } from '@/types/options.type';
import { NavigateDirection } from '@/types/view.type';
import DayjsTZDate from '@/time/dayjs-tzdate';

const VIEW_LABELS: Record<ViewType, string> = {
  day: '日',
  week: '周',
  month: '月',
  scheduler: '资源',
};

const VIEW_ORDER: ViewType[] = ['day', 'week', 'month', 'scheduler'];

function getDateRangeText(view: ViewType, renderDate: DayjsTZDate): string {
  const d = renderDate.dayjs;
  if (view === 'day') {
    return d.format('YYYY年M月D日');
  }
  if (view === 'month') {
    return d.format('YYYY年M月');
  }
  // week / scheduler
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
  const setView = useCalendarStore((s) => s.view.setView);
  const navigate = useCalendarStore((s) => s.view.navigate);
  const goToToday = useCalendarStore((s) => s.view.goToToday);

  const dateText = getDateRangeText(currentView, renderDate);

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
        {VIEW_ORDER.map((v) => (
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
