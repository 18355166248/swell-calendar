import { WEEK_DAY_NAME_BORDER, WEEK_DAY_NAME_HEIGHT } from '@/constants/style.const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useThemeStore } from '@/contexts/themeStore';
import { cls } from '@/helpers/css';
import {
  createSchedulerTimeGridData,
  getVisibleResources,
  getWeekDates,
  getWeekViewEvents,
} from '@/helpers/grid';
import { toEndOfDay, toStartOfDay } from '@/time/datetime';
import { useMemo } from 'react';
import Layout from '../Layout';
import Panel from '../Panel';
import { SchedulerHeader } from '../scheduler/SchedulerHeader';
import { TimeGrid } from '../timeGrid/TimeGridView';

const SCHEDULER_HEADER_HEIGHT = WEEK_DAY_NAME_HEIGHT + 32 + WEEK_DAY_NAME_BORDER;

export function Scheduler() {
  const { options, calendar, view } = useCalendarStore();
  const { timeGridLeft } = useThemeStore((state) => state.week);
  const { renderDate } = view;
  const schedulerOptions = options.scheduler;
  const weekOptions = options.week;

  const resources = useMemo(
    () => getVisibleResources(schedulerOptions?.resources ?? []),
    [schedulerOptions?.resources]
  );
  const hourStart = schedulerOptions?.hourStart ?? weekOptions?.hourStart ?? 0;
  const hourEnd = schedulerOptions?.hourEnd ?? weekOptions?.hourEnd ?? 24;
  const hourDivision = weekOptions?.hourDivision ?? 2;

  const weekDates = useMemo(
    () => getWeekDates(renderDate, weekOptions ?? {}),
    [renderDate, weekOptions]
  );

  const { weekStart, weekEnd } = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[weekDates.length - 1];

    return {
      weekStart: toStartOfDay(first),
      weekEnd: toEndOfDay(last),
    };
  }, [weekDates]);

  const timeEvents = useMemo(
    () =>
      getWeekViewEvents(weekDates, calendar, {
        narrowWeekend: false,
        hourStart,
        hourEnd,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
      }).time,
    [weekDates, calendar, hourStart, hourEnd, weekStart, weekEnd]
  );

  const timeGridData = useMemo(
    () =>
      createSchedulerTimeGridData(weekDates, resources, {
        hourStart,
        hourEnd,
        hourDivision,
      }),
    [weekDates, resources, hourStart, hourEnd, hourDivision]
  );

  if (resources.length === 0) {
    return (
      <div className={cls('scheduler-empty')}>
        <p>暂无资源配置，请通过 scheduler.resources 传入资源列表</p>
      </div>
    );
  }

  return (
    <Layout className={cls('scheduler-view')}>
      <Panel name="scheduler-header" initialHeight={SCHEDULER_HEADER_HEIGHT}>
        <SchedulerHeader
          weekDates={weekDates}
          resources={resources}
          timeGridLeftWidth={timeGridLeft.width}
        />
      </Panel>
      <Panel name="time">
        <TimeGrid timeGridData={timeGridData} events={timeEvents} />
      </Panel>
    </Layout>
  );
}
