import {
  CSSProperties,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Layout from '@/components/Layout';
import { KEY } from '@/constants/keyboard';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
import {
  AgendaEventItem,
  getAgendaDateAt,
  getAgendaDayCount,
  getAgendaDayGroup,
  getAgendaDayGroups,
} from '@/controller/agenda.controller';
import { cls, getEventColors } from '@/helpers/css';
import { useCalendarColor } from '@/hooks/calendar/useCalendarColor';
import { useViewportTier } from '@/hooks/common/useViewportTier';
import { useVirtualList } from '@/hooks/common/useVirtualList';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { getTierClassName } from '@/utils/viewport';

import { Template } from '../Template';

type AgendaDayGroup = ReturnType<typeof getAgendaDayGroups>[number];

const MOBILE_AGENDA_OVERSCAN = 3;
const MOBILE_AGENDA_HEADER_ESTIMATE = 48;
const MOBILE_AGENDA_EMPTY_ESTIMATE = 42;
const MOBILE_AGENDA_EVENT_ESTIMATE = 58;
const MOBILE_AGENDA_DAY_GAP_ESTIMATE = 12;

function formatDayTitle(date: DayjsTZDate): string {
  return date.dayjs.format('dddd M月D日');
}

function estimateMobileAgendaGroupHeight(group: AgendaDayGroup): number {
  // 每个日期组都渲染头部；当前组的头部由覆盖式固定 header 盖住（见 .agenda-day-header--fixed），
  // 所以这里高度对所有组一致，避免随激活组变化产生估算抖动。
  const headerHeight = MOBILE_AGENDA_HEADER_ESTIMATE;
  const listHeight =
    group.events.length > 0
      ? group.events.length * MOBILE_AGENDA_EVENT_ESTIMATE
      : MOBILE_AGENDA_EMPTY_ESTIMATE;

  return headerHeight + listHeight + MOBILE_AGENDA_DAY_GAP_ESTIMATE;
}

function formatEventTimeParts(item: AgendaEventItem): { primary: string; secondary?: string } {
  const { uiModel, isAllday, startsBeforeDay, endsAfterDay } = item;

  if (isAllday) {
    return { primary: '全天' };
  }

  const start = startsBeforeDay ? '' : uiModel.model.start.dayjs.format('HH:mm');
  const end = endsAfterDay ? '' : uiModel.model.end.dayjs.format('HH:mm');

  if (startsBeforeDay && endsAfterDay) {
    return { primary: '全天', secondary: '延续' };
  }
  if (startsBeforeDay) {
    return { primary: end, secondary: '结束' };
  }
  if (endsAfterDay) {
    return { primary: start, secondary: '开始' };
  }

  return { primary: start, secondary: end };
}

function AgendaEventRow({ item }: { item: AgendaEventItem }) {
  const { uiModel } = item;
  const { model } = uiModel;
  const callbacks = useCalendarCallbacks();
  const calendarColor = useCalendarColor(model);
  const colors = getEventColors(uiModel, calendarColor);
  const eventObject = model.toEventObject();
  const timeParts = formatEventTimeParts(item);

  const openEvent = () => callbacks?.onEventClick?.({ event: eventObject });
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === KEY.ENTER || e.key === KEY.SPACE) {
      e.preventDefault();
      openEvent();
    }
  };

  return (
    <button
      type="button"
      className={cls('agenda-event', { 'agenda-event--allday': item.isAllday })}
      style={
        {
          '--swell-agenda-event-bg': colors.backgroundColor,
          '--swell-agenda-event-border': colors.borderColor,
          '--swell-agenda-event-text': colors.color,
        } as CSSProperties & {
          '--swell-agenda-event-bg': string | undefined;
          '--swell-agenda-event-border': string | undefined;
          '--swell-agenda-event-text': string | undefined;
        }
      }
      data-testid={`agenda-event-${model.id}`}
      onClick={openEvent}
      onKeyDown={handleKeyDown}
    >
      <span className={cls('agenda-event-mark')} aria-hidden />
      <span className={cls('agenda-event-main')}>
        <span className={cls('agenda-event-title')}>{model.title || '无标题'}</span>
        <Template template="agendaEventMeta" as="span" param={eventObject} />
      </span>
      <span className={cls('agenda-event-time')}>
        <span>{timeParts.primary}</span>
        {timeParts.secondary ? (
          <span className={cls('agenda-event-time-end')}>{timeParts.secondary}</span>
        ) : null}
      </span>
    </button>
  );
}

export function Agenda() {
  const { options, view } = useCalendarStore();
  const calendar = useCalendarStore((state) => state.calendar);
  const callbacks = useCalendarCallbacks();
  const [viewportTier, setViewportRef] = useViewportTier();
  const initialScrollKeyRef = useRef<string | null>(null);
  const initialScrollPassRef = useRef(0);
  const uiModelCacheRef = useRef<Map<number, EventUIModel>>(new Map());
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const isMobile = viewportTier === 'mobile';
  const useLazyMobileGroups = isMobile && options.agenda.showEmptyDays;
  const groups = useMemo(
    () =>
      useLazyMobileGroups ? [] : getAgendaDayGroups(calendar, view.renderDate, options.agenda),
    [calendar, options.agenda, useLazyMobileGroups, view.renderDate]
  );
  const lazyGroupCount = useLazyMobileGroups ? getAgendaDayCount(options.agenda) : 0;
  const groupCount = useLazyMobileGroups ? lazyGroupCount : groups.length;
  const todayRef = useRef(new DayjsTZDate());

  useEffect(() => {
    uiModelCacheRef.current = new Map();
    todayRef.current = new DayjsTZDate();
  }, [calendar, options.agenda, view.renderDate]);

  const getGroupAt = useCallback(
    (index: number): AgendaDayGroup => {
      if (!useLazyMobileGroups) {
        return groups[index];
      }
      return getAgendaDayGroup(
        calendar,
        getAgendaDateAt(view.renderDate, options.agenda, index),
        uiModelCacheRef.current,
        todayRef.current
      );
    },
    [calendar, groups, options.agenda, useLazyMobileGroups, view.renderDate]
  );

  const estimateAgendaGroupHeight = useCallback(
    (index: number) => {
      if (!useLazyMobileGroups) {
        return estimateMobileAgendaGroupHeight(groups[index]);
      }

      const date = getAgendaDateAt(view.renderDate, options.agenda, index);
      const eventCount = calendar.idsOfDay[date.dayjs.format('YYYYMMDD')]?.length ?? 0;
      const listHeight =
        eventCount > 0 ? eventCount * MOBILE_AGENDA_EVENT_ESTIMATE : MOBILE_AGENDA_EMPTY_ESTIMATE;

      return MOBILE_AGENDA_HEADER_ESTIMATE + listHeight + MOBILE_AGENDA_DAY_GAP_ESTIMATE;
    },
    [calendar.idsOfDay, groups, options.agenda, useLazyMobileGroups, view.renderDate]
  );
  const virtualList = useVirtualList({
    count: groupCount,
    estimateSize: estimateAgendaGroupHeight,
    enabled: isMobile,
    overscan: MOBILE_AGENDA_OVERSCAN,
    resetKey: useLazyMobileGroups
      ? `${view.renderDate.dayjs.format('YYYY-MM-DD')}:${options.agenda.offset}:${options.agenda.range}`
      : groups,
  });
  const {
    bottomSpacerHeight,
    getIndexAtOffset,
    measureElement,
    onScroll,
    scrollRef,
    scrollToIndex,
    topSpacerHeight,
    viewportHeight: vh,
    virtualItems,
  } = virtualList;

  const visibleGroups = isMobile ? virtualItems.map((item) => getGroupAt(item.index)) : groups;

  const renderDayHeader = (group: (typeof groups)[number], fixed = false) => (
    <div className={cls('agenda-day-header', { 'agenda-day-header--fixed': fixed })}>
      <span className={cls('agenda-day-title')}>{formatDayTitle(group.date)}</span>
      <span className={cls('agenda-day-count')}>
        <Template
          template="agendaDayHeader"
          as="span"
          param={{
            date: group.date.getDate(),
            day: group.date.getDay(),
            dayName: group.date.dayjs.format('ddd'),
            eventCount: group.events.length,
            isToday: group.isToday,
            month: group.date.getMonth(),
            renderDate: group.date.dayjs.format('YYYY-MM-DD'),
            secondaryLabel: group.events.length ? `${group.events.length}项` : '无日程',
            ymd: group.date.dayjs.format('YYYYMMDD'),
            dateInstance: group.date,
          }}
        />
      </span>
    </div>
  );

  const handleAgendaScroll = useCallback(() => {
    if (!isMobile) return;
    onScroll();
    const nextScrollTop = scrollRef.current?.scrollTop ?? 0;
    const nextIndex = getIndexAtOffset(nextScrollTop + 1);

    if (activeGroupIndex === nextIndex) return;

    setActiveGroupIndex(nextIndex);
    callbacks?.onAgendaVisibleDateChange?.({ date: getGroupAt(nextIndex).date });
  }, [activeGroupIndex, callbacks, getGroupAt, isMobile, getIndexAtOffset, onScroll, scrollRef]);

  useEffect(() => {
    if (!isMobile) return;
    const renderDateKey = view.renderDate.dayjs.format('YYYY-MM-DD');
    if (initialScrollKeyRef.current !== renderDateKey) {
      initialScrollKeyRef.current = renderDateKey;
      initialScrollPassRef.current = 0;
    }

    if (initialScrollPassRef.current >= 8) return;

    const targetIndex = useLazyMobileGroups
      ? Math.max(0, Math.min(groupCount - 1, -Math.trunc(options.agenda.offset)))
      : groups.findIndex((group) => group.date.dayjs.format('YYYY-MM-DD') === renderDateKey);
    if (targetIndex < 0) return;

    if (vh < 80) return;

    initialScrollPassRef.current += 1;
    setActiveGroupIndex(targetIndex);
    callbacks?.onAgendaVisibleDateChange?.({ date: getGroupAt(targetIndex).date });
    scrollToIndex(targetIndex);
  }, [
    callbacks,
    getGroupAt,
    groupCount,
    groups,
    isMobile,
    options.agenda.offset,
    scrollToIndex,
    useLazyMobileGroups,
    view.renderDate,
    vh,
  ]);

  return (
    <Layout className={getTierClassName('agenda-view', viewportTier)} rootRef={setViewportRef}>
      {isMobile && groupCount > 0 ? renderDayHeader(getGroupAt(activeGroupIndex), true) : null}
      <div className={cls('agenda-scroll')} ref={scrollRef} onScroll={handleAgendaScroll}>
        {isMobile && topSpacerHeight > 0 ? (
          <div aria-hidden style={{ height: topSpacerHeight }} />
        ) : null}
        {visibleGroups.map((group, virtualIndex) => {
          const index = isMobile ? virtualItems[virtualIndex].index : virtualIndex;
          return (
            <section
              key={group.date.dayjs.format('YYYY-MM-DD')}
              className={cls('agenda-day', { 'agenda-day--today': group.isToday })}
              ref={isMobile ? (el) => measureElement(index, el) : undefined}
              data-agenda-index={isMobile ? index : undefined}
            >
              {renderDayHeader(group)}
              <div className={cls('agenda-day-list')}>
                {group.events.length > 0 ? (
                  group.events.map((item) => (
                    <AgendaEventRow
                      key={`${item.uiModel.cid()}-${group.date.getTime()}`}
                      item={item}
                    />
                  ))
                ) : (
                  <div className={cls('agenda-empty')}>无日程</div>
                )}
              </div>
            </section>
          );
        })}
        {isMobile && bottomSpacerHeight > 0 ? (
          <div aria-hidden style={{ height: bottomSpacerHeight }} />
        ) : null}
      </div>
    </Layout>
  );
}
