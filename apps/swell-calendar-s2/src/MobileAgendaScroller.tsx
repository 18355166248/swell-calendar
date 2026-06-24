import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';

import { useVirtualList } from 'swell-calendar';

import { dayIndexToDate, decimalHourToTime } from './calendarData';
import { CAT_COLOR_STYLES, type CalEvent } from './data';

const AGENDA_MONTHS_BEFORE = 24;
const AGENDA_MONTHS_AFTER = 12;
const AGENDA_OVERSCAN = 3;
const AGENDA_HEADER_ESTIMATE = 48;
const AGENDA_EMPTY_ESTIMATE = 42;
const AGENDA_EVENT_ESTIMATE = 58;
const AGENDA_DAY_GAP_ESTIMATE = 12;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function diffDays(start: Date, end: Date): number {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endDay.getTime() - startDay.getTime()) / 86_400_000);
}

function addDays(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

function formatDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDayTitle(date: Date): string {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${weekdays[date.getDay()]} ${date.getMonth() + 1}月${date.getDate()}日`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
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
    list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start - b.start);
  }

  return grouped;
}

interface MobileAgendaScrollerProps {
  currentDate: Date;
  events: CalEvent[];
  onVisibleDateChange: (date: Date) => void;
  onEventClick: (event: CalEvent, anchor: HTMLElement) => void;
}

export function MobileAgendaScroller({
  currentDate,
  events,
  onVisibleDateChange,
  onEventClick,
}: MobileAgendaScrollerProps) {
  const today = new Date();
  const baseMonthRef = useRef(startOfMonth(currentDate));
  const userTookControlRef = useRef(false);
  const activeIndexRef = useRef(AGENDA_MONTHS_BEFORE * 31);

  const { days, initialIndex } = useMemo(() => {
    const start = addMonths(baseMonthRef.current, -AGENDA_MONTHS_BEFORE);
    const endExclusive = addMonths(baseMonthRef.current, AGENDA_MONTHS_AFTER + 1);
    const count = diffDays(start, endExclusive);
    return {
      days: Array.from({ length: count }, (_, index) => addDays(start, index)),
      initialIndex: diffDays(start, currentDate),
    };
  }, [currentDate]);

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const virtualList = useVirtualList({
    count: days.length,
    estimateSize: (index) => {
      const count = eventsByDate.get(formatDateKey(days[index]))?.length ?? 0;
      return (
        AGENDA_HEADER_ESTIMATE +
        (count > 0 ? count * AGENDA_EVENT_ESTIMATE : AGENDA_EMPTY_ESTIMATE) +
        AGENDA_DAY_GAP_ESTIMATE
      );
    },
    enabled: true,
    overscan: AGENDA_OVERSCAN,
    resetKey: days,
  });

  // 初次挂载时只把列表对齐到焦点日期；用户接管后不再回弹，避免滚动中被测量修正抢控制权。
  useLayoutEffect(() => {
    if (userTookControlRef.current) return;
    virtualList.scrollToIndex(initialIndex);
    activeIndexRef.current = initialIndex;
  }, [initialIndex, virtualList.scrollToIndex]);

  const markUserControl = () => {
    userTookControlRef.current = true;
  };

  const handleScroll = () => {
    virtualList.onScroll();
    const scroller = virtualList.scrollRef.current;
    if (!scroller) return;

    const nextIndex = virtualList.getIndexAtOffset(scroller.scrollTop + 1);
    if (nextIndex === activeIndexRef.current) return;

    activeIndexRef.current = nextIndex;
    onVisibleDateChange(days[nextIndex]);
  };

  const activeDate = days[Math.min(Math.max(activeIndexRef.current, 0), days.length - 1)];

  return (
    <div className="m-agenda">
      {activeDate ? (
        <div className="m-agenda-fixed-date">
          <span>{formatDayTitle(activeDate)}</span>
          <span>{eventsByDate.get(formatDateKey(activeDate))?.length || '无'}日程</span>
        </div>
      ) : null}
      <div
        className="m-agenda-scroller"
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
          const date = days[virtualItem.index];
          const key = formatDateKey(date);
          const dayEvents = eventsByDate.get(key) ?? [];
          return (
            <section
              key={key}
              ref={(el) => virtualList.measureElement(virtualItem.index, el)}
              className={'m-agenda-day' + (isSameDay(date, today) ? ' is-today' : '')}
            >
              <div className="m-agenda-day-header">
                <span>{formatDayTitle(date)}</span>
                <span>{dayEvents.length ? `${dayEvents.length}项` : '无日程'}</span>
              </div>
              <div className="m-agenda-day-list">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => {
                    const colors = CAT_COLOR_STYLES[event.cat];
                    return (
                      <button
                        key={`${event.id}-${key}`}
                        type="button"
                        className={'m-agenda-event' + (event.allDay ? ' is-allday' : '')}
                        style={
                          {
                            '--m-agenda-event-bg': colors.fill,
                            '--m-agenda-event-border': colors.line,
                            '--m-agenda-event-text': colors.text,
                          } as CSSProperties
                        }
                        onClick={(clickEvent) => onEventClick(event, clickEvent.currentTarget)}
                      >
                        <span className="m-agenda-event-mark" aria-hidden />
                        <span className="m-agenda-event-main">
                          <span className="m-agenda-event-title">{event.title || '无标题'}</span>
                          <span className="m-agenda-event-meta">
                            {[event.loc, event.who].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <span className="m-agenda-event-time">
                          {event.allDay ? '全天' : decimalHourToTime(event.start)}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="m-agenda-empty">无日程</div>
                )}
              </div>
            </section>
          );
        })}
        {virtualList.bottomSpacerHeight > 0 ? (
          <div aria-hidden style={{ height: virtualList.bottomSpacerHeight }} />
        ) : null}
      </div>
    </div>
  );
}
