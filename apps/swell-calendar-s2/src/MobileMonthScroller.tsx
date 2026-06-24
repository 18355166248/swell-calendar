import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';

import { useVirtualList } from 'swell-calendar';

import { dayIndexToDate } from './calendarData';
import { CAT_COLOR_STYLES, type CalEvent } from './data';
import { lunarLabelOf } from './lunar';

const MONTH_RANGE_BEFORE = 24;
const MONTH_RANGE_AFTER = 12;
const MONTH_DOW = ['一', '二', '三', '四', '五', '六', '日'];
const MONTH_OVERSCAN = 3;
const MONTH_SECTION_BASE_HEIGHT = 68;
const MONTH_WEEK_ROW_HEIGHT = 85;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function formatDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface MonthCell {
  date: Date;
  inMonth: boolean;
  key: string;
}

// 月份网格与农历都只取决于年月/日期，纯确定性结果。用模块级缓存避免快速滚动时
// 每帧对可见月份重算 cells 与逐格农历。
const monthCellsCache = new Map<string, MonthCell[]>();
const lunarCache = new Map<string, ReturnType<typeof lunarLabelOf>>();

function buildMonthCells(monthDate: Date): MonthCell[] {
  const cacheKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
  const cached = monthCellsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const firstDay = startOfMonth(monthDate);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayIndex(firstDay));

  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const totalCells = Math.ceil((mondayIndex(firstDay) + lastDay.getDate()) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      inMonth: date.getMonth() === monthDate.getMonth(),
      key: formatDateKey(date),
    };
  });
  monthCellsCache.set(cacheKey, cells);
  return cells;
}

function cachedLunarLabel(key: string, date: Date) {
  const cached = lunarCache.get(key);
  if (cached) {
    return cached;
  }
  const lunar = lunarLabelOf(date);
  lunarCache.set(key, lunar);
  return lunar;
}

function estimateMonthSectionHeight(monthDate: Date): number {
  return (
    MONTH_SECTION_BASE_HEIGHT + (buildMonthCells(monthDate).length / 7) * MONTH_WEEK_ROW_HEIGHT
  );
}

function groupEventsByDate(events: CalEvent[]): Map<string, CalEvent[]> {
  const grouped = new Map<string, CalEvent[]>();

  for (const event of events) {
    const startDay = event.day;
    const endDay = event.endDay ?? event.day;
    for (let day = startDay; day <= endDay; day += 1) {
      const key = dayIndexToDate(day);
      const list = grouped.get(key) ?? [];
      list.push(event);
      grouped.set(key, list);
    }
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => a.start - b.start);
  }

  return grouped;
}

interface MobileMonthScrollerProps {
  currentDate: Date;
  visibleMonth: Date;
  events: CalEvent[];
  onDateChange: (date: Date) => void;
  onVisibleMonthChange: (date: Date) => void;
  onEventClick: (event: CalEvent, anchor: HTMLElement) => void;
}

export function MobileMonthScroller({
  currentDate,
  visibleMonth,
  events,
  onDateChange,
  onVisibleMonthChange,
  onEventClick,
}: MobileMonthScrollerProps) {
  const baseMonthRef = useRef(startOfMonth(currentDate));
  // 用户是否已经主动滚动/操作过列表。一旦接管，就停止把列表回弹到基准月，
  // 避免测量修正引发的“滚动→弹回”闪动，并解锁可见月份上报。
  const userTookControlRef = useRef(false);
  const today = new Date();

  const months = useMemo(
    () =>
      Array.from({ length: MONTH_RANGE_BEFORE + MONTH_RANGE_AFTER + 1 }, (_, index) =>
        addMonths(baseMonthRef.current, index - MONTH_RANGE_BEFORE)
      ),
    []
  );

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const estimateMonthHeight = useMemo(
    () => (index: number) => estimateMonthSectionHeight(months[index]),
    [months]
  );
  const virtualList = useVirtualList({
    count: months.length,
    estimateSize: estimateMonthHeight,
    enabled: true,
    overscan: MONTH_OVERSCAN,
    resetKey: months,
  });

  // 初始把列表定位到基准月（当前月）。测量修正会让 itemOffsets 反复变化，
  // 在用户接管之前持续重新对齐基准月，使估算→实测的高度修正不把初始位置带偏；
  // 用户一旦主动滚动就停止，绝不与用户的滚动竞争。
  useLayoutEffect(() => {
    if (userTookControlRef.current) return;
    virtualList.scrollToIndex(MONTH_RANGE_BEFORE);
  }, [virtualList.scrollToIndex]);

  const markUserControl = () => {
    userTookControlRef.current = true;
  };

  const handleScroll = () => {
    virtualList.onScroll();

    const scroller = virtualList.scrollRef.current;
    if (!scroller) return;

    // 顶部月份判定改读真实 DOM 位置，取「在视口内可见面积最大」的 section：
    // - 不再依赖虚拟列表 getIndexAtOffset 的「估算 vs 实测」高度差——该差值在月份边界处会随
    //   滚动方向产生 off-by-one，导致顶部「M月」标题方向性滞后；改用 DOM 矩形后结果只取决于位置。
    // - 用可见面积最大而非「顶边第一个 section」，避免上一个月仅剩几像素残留在顶边时仍判为当前月，
    //   与用户实际看到的主体月份一致。
    const rect = scroller.getBoundingClientRect();
    const topEdge = rect.top;
    const bottomEdge = rect.bottom;
    const sections = scroller.querySelectorAll<HTMLElement>('.m-month-section[data-month]');
    let topKey: string | null = null;
    let maxVisible = 0;
    for (const section of sections) {
      const r = section.getBoundingClientRect();
      const visible = Math.min(r.bottom, bottomEdge) - Math.max(r.top, topEdge);
      if (visible > maxVisible) {
        maxVisible = visible;
        topKey = section.dataset.month ?? null;
      }
    }
    if (!topKey) return;

    const [year, month] = topKey.split('-').map(Number);
    if (year !== visibleMonth.getFullYear() || month - 1 !== visibleMonth.getMonth()) {
      onVisibleMonthChange(new Date(year, month - 1, 1));
    }
  };

  return (
    <div
      className="m-month-scroller"
      ref={virtualList.scrollRef}
      onScroll={handleScroll}
      onWheel={markUserControl}
      onTouchStart={markUserControl}
      onPointerDown={markUserControl}
      onKeyDown={markUserControl}
    >
      {virtualList.topSpacerHeight > 0 ? (
        <div aria-hidden style={{ height: virtualList.topSpacerHeight }} />
      ) : null}
      {virtualList.virtualItems.map((virtualItem) => {
        const month = months[virtualItem.index];
        const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        const cells = buildMonthCells(month);

        return (
          <section
            key={monthKey}
            ref={(el) => virtualList.measureElement(virtualItem.index, el)}
            className="m-month-section"
            data-month={monthKey}
          >
            <div className="m-month-section-divider" aria-hidden>
              {month.getMonth() + 1}月
            </div>
            <div className="m-month-continuous-grid">
              {MONTH_DOW.map((dow) => (
                <div key={`${monthKey}-${dow}`} className="m-month-inline-dow">
                  {dow}
                </div>
              ))}
              {cells.map(({ date, inMonth, key }) => {
                const lunar = cachedLunarLabel(key, date);
                const dayEvents = eventsByDate.get(key) ?? [];
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!inMonth}
                    className={
                      'm-month-day' +
                      (inMonth ? '' : ' is-outside') +
                      (isSameDay(date, today) ? ' is-today' : '') +
                      (isSameDay(date, currentDate) ? ' is-selected' : '')
                    }
                    onClick={() => {
                      if (inMonth) {
                        onDateChange(date);
                      }
                    }}
                  >
                    <span className="m-month-day-badge">
                      <span className="m-month-day-num">{date.getDate()}</span>
                      <span className={'m-month-day-lunar' + (lunar.isTerm ? ' is-term' : '')}>
                        {lunar.text}
                      </span>
                    </span>
                    <span className="m-month-day-events">
                      {dayEvents.slice(0, 3).map((event) => {
                        const colors = CAT_COLOR_STYLES[event.cat];
                        return (
                          <span
                            key={`${event.id}-${key}`}
                            className="m-month-event-chip"
                            style={
                              {
                                '--m-month-event-bg': colors.fill,
                                '--m-month-event-text': colors.text,
                              } as CSSProperties
                            }
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              onEventClick(event, clickEvent.currentTarget);
                            }}
                          >
                            {event.title}
                          </span>
                        );
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      {virtualList.bottomSpacerHeight > 0 ? (
        <div aria-hidden style={{ height: virtualList.bottomSpacerHeight }} />
      ) : null}
    </div>
  );
}
