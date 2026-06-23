import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

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

function buildMonthCells(monthDate: Date) {
  const firstDay = startOfMonth(monthDate);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayIndex(firstDay));

  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const totalCells = Math.ceil((mondayIndex(firstDay) + lastDay.getDate()) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      inMonth: date.getMonth() === monthDate.getMonth(),
      key: formatDateKey(date),
    };
  });
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
  const initialScrollPassRef = useRef(0);
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

  useEffect(() => {
    if (initialScrollPassRef.current >= 8) return;
    initialScrollPassRef.current += 1;
    virtualList.scrollToIndex(MONTH_RANGE_BEFORE);
  }, [virtualList.scrollToIndex]);

  const handleScroll = () => {
    virtualList.onScroll();
    if (initialScrollPassRef.current < 8) return;

    const nextIndex = virtualList.getIndexAtOffset(
      (virtualList.scrollRef.current?.scrollTop ?? 0) + 1
    );
    const next = months[nextIndex];
    if (
      next &&
      (next.getFullYear() !== visibleMonth.getFullYear() ||
        next.getMonth() !== visibleMonth.getMonth())
    ) {
      onVisibleMonthChange(next);
    }
  };

  return (
    <div className="m-month-scroller" ref={virtualList.scrollRef} onScroll={handleScroll}>
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
                const lunar = lunarLabelOf(date);
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
