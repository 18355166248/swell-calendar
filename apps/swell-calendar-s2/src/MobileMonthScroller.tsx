import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

import { dayIndexToDate } from './calendarData';
import { CAT_COLOR_STYLES, type CalEvent } from './data';
import { lunarLabelOf } from './lunar';

const MONTH_RANGE_BEFORE = 24;
const MONTH_RANGE_AFTER = 12;
const MONTH_DOW = ['一', '二', '三', '四', '五', '六', '日'];

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
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const currentMonthRef = useRef<HTMLElement | null>(null);
  const baseMonthRef = useRef(startOfMonth(currentDate));
  const didInitialScrollRef = useRef(false);
  const today = new Date();

  const months = useMemo(
    () =>
      Array.from({ length: MONTH_RANGE_BEFORE + MONTH_RANGE_AFTER + 1 }, (_, index) =>
        addMonths(baseMonthRef.current, index - MONTH_RANGE_BEFORE)
      ),
    []
  );

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  useEffect(() => {
    if (didInitialScrollRef.current) return;
    didInitialScrollRef.current = true;
    currentMonthRef.current?.scrollIntoView({ block: 'start' });
  }, [months]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
        const target = visible[0]?.target as HTMLElement | undefined;
        const monthKey = target?.dataset.month;
        if (!monthKey) return;

        const [year, month] = monthKey.split('-').map(Number);
        const next = new Date(year, (month || 1) - 1, 1);
        if (
          next.getFullYear() !== visibleMonth.getFullYear() ||
          next.getMonth() !== visibleMonth.getMonth()
        ) {
          onVisibleMonthChange(next);
        }
      },
      {
        root: scroller,
        threshold: [0.2, 0.6],
        rootMargin: '-8% 0px -72% 0px',
      }
    );

    scroller.querySelectorAll<HTMLElement>('.m-month-section').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, [months, onVisibleMonthChange, visibleMonth]);

  return (
    <div className="m-month-scroller" ref={scrollerRef}>
      {months.map((month) => {
        const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        const cells = buildMonthCells(month);
        const isCurrentMonth =
          month.getFullYear() === currentDate.getFullYear() &&
          month.getMonth() === currentDate.getMonth();

        return (
          <section
            key={monthKey}
            ref={isCurrentMonth ? currentMonthRef : undefined}
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
    </div>
  );
}
