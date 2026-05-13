import type { Meta, StoryObj } from '@storybook/react-vite';
import Chance from 'chance';
import dayjs from 'dayjs';
import { ReactNode, useMemo, useState } from 'react';

import { Calendar } from '@/components/Calendar';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarCallbacks } from '@/types/callbacks.type';
import { EventObject } from '@/types/events.type';

const chance = new Chance();

const RESOURCES = [
  { id: 'r1', name: '会议室 A', backgroundColor: '#3b82f6', color: '#fff' },
  { id: 'r2', name: '会议室 B', backgroundColor: '#10b981', color: '#fff' },
  { id: 'r3', name: '张三', backgroundColor: '#f59e0b', color: '#fff' },
  { id: 'r4', name: '李四', backgroundColor: '#ef4444', color: '#fff' },
  { id: 'r5', name: '王五', backgroundColor: '#8b5cf6', color: '#fff' },
];

const TEMPLATE_RESOURCES = RESOURCES.slice(0, 3);
const SCHEDULER_STORY_MIN_WIDTH = 1360;

function SchedulerStoryFrame({
  children,
  minWidth = SCHEDULER_STORY_MIN_WIDTH,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflowX: 'auto', overflowY: 'hidden' }}>
      <div style={{ position: 'relative', minWidth, height: '100%' }}>{children}</div>
    </div>
  );
}

function createSchedulerEvents(
  resources: typeof RESOURCES = RESOURCES,
  countPerResource = 6
): EventObject[] {
  const today = new DayjsTZDate();
  const weekStart = today.addDate(-today.getDay());
  const events: EventObject[] = [];
  let id = 1;

  resources.forEach((resource) => {
    for (let i = 0; i < countPerResource; i++) {
      const dayOffset = chance.integer({ min: 0, max: 6 });
      const startHour = chance.integer({ min: 8, max: 18 });
      const duration = chance.integer({ min: 1, max: 3 });

      const start = dayjs(weekStart.getTime()).add(dayOffset, 'day').hour(startHour).minute(0);
      const end = start.add(duration, 'hour');

      events.push({
        id: `sched-${id++}`,
        title: chance.sentence({ words: 3 }),
        category: 'time',
        start: start.toDate(),
        end: end.toDate(),
        resourceId: resource.id,
        backgroundColor: resource.backgroundColor,
        color: resource.color,
      });
    }
  });

  return events;
}

function getTimeValue(value: EventObject['start']) {
  if (!value) {
    return 0;
  }

  if (typeof value === 'number' || typeof value === 'string' || value instanceof Date) {
    return new Date(value).getTime();
  }

  return value.getTime();
}

function hasOverlap(events: EventObject[], targetEvent: EventObject, previousEventId?: string) {
  const targetResourceId = targetEvent.resourceId ?? targetEvent.resourceIds?.[0];
  const targetStart = getTimeValue(targetEvent.start);
  const targetEnd = getTimeValue(targetEvent.end);

  return events.some((event) => {
    if (event.id === previousEventId) {
      return false;
    }

    const eventResourceId = event.resourceId ?? event.resourceIds?.[0];

    if (!targetResourceId || eventResourceId !== targetResourceId) {
      return false;
    }

    const eventStart = getTimeValue(event.start);
    const eventEnd = getTimeValue(event.end);

    return targetStart < eventEnd && targetEnd > eventStart;
  });
}

const meta = {
  title: 'Calendar/Scheduler',
  component: Calendar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SchedulerStoryFrame>
      <Calendar
        events={createSchedulerEvents()}
        options={{
          defaultView: 'scheduler',
          scheduler: {
            resources: RESOURCES,
            hourStart: 8,
            hourEnd: 20,
          },
        }}
      />
    </SchedulerStoryFrame>
  ),
};

export const ControlledCrud: Story = {
  render: function ControlledCrudStory() {
    const [events, setEvents] = useState<EventObject[]>(() => createSchedulerEvents());
    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventCreate: ({ event }) => {
          const resourceId = event.resourceId ?? event.resourceIds?.[0];
          const resource = RESOURCES.find((item) => item.id === resourceId);

          setEvents((current) => [
            ...current,
            {
              ...event,
              id: `sched-created-${current.length + 1}`,
              title: event.title || '新建预约',
              backgroundColor: resource?.backgroundColor ?? '#0f766e',
              color: resource?.color ?? '#fff',
            },
          ]);
        },
        onEventUpdate: ({ event, previousEvent }) => {
          setEvents((current) =>
            current.map((item) =>
              item.id === previousEvent.id
                ? {
                    ...item,
                    ...event,
                  }
                : item
            )
          );
        },
        onValidateEventChange: ({ event, previousEvent }) => {
          return !hasOverlap(events, event, previousEvent?.id);
        },
      }),
      [events]
    );

    return (
      <SchedulerStoryFrame>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'scheduler',
            scheduler: {
              resources: RESOURCES,
              hourStart: 8,
              hourEnd: 20,
            },
          }}
        />
      </SchedulerStoryFrame>
    );
  },
};

export const BlockedTimes: Story = {
  render: () => (
    <SchedulerStoryFrame>
      <Calendar
        events={createSchedulerEvents()}
        options={{
          defaultView: 'scheduler',
          scheduler: {
            resources: RESOURCES,
            hourStart: 8,
            hourEnd: 20,
            blockedTimes: [
              {
                start: dayjs().startOf('day').hour(12).minute(0).toDate(),
                end: dayjs().startOf('day').hour(14).minute(0).toDate(),
              },
              {
                start: dayjs().startOf('day').add(1, 'day').hour(9).minute(0).toDate(),
                end: dayjs().startOf('day').add(1, 'day').hour(11).minute(0).toDate(),
                resourceId: 'r1',
              },
            ],
          },
        }}
      />
    </SchedulerStoryFrame>
  ),
};

export const Invalid: Story = {
  render: () => (
    <SchedulerStoryFrame>
      <Calendar
        events={createSchedulerEvents()}
        options={{
          defaultView: 'scheduler',
          scheduler: {
            resources: RESOURCES,
            hourStart: 8,
            hourEnd: 20,
            invalid: [
              {
                start: dayjs().startOf('day').hour(13).minute(0).toDate(),
                end: dayjs().startOf('day').hour(15).minute(0).toDate(),
              },
            ],
          },
        }}
      />
    </SchedulerStoryFrame>
  ),
};

export const InvalidAndColors: Story = {
  render: () => {
    const today = dayjs().startOf('day');
    return (
      <SchedulerStoryFrame>
        <Calendar
          events={createSchedulerEvents()}
          options={{
            defaultView: 'scheduler',
            scheduler: {
              resources: RESOURCES,
              hourStart: 8,
              hourEnd: 20,
              colors: [
                {
                  start: today.hour(9).minute(0).toDate(),
                  end: today.hour(12).minute(0).toDate(),
                  background: 'rgba(34, 197, 94, 0.18)',
                  cssClass: 'available',
                },
                {
                  start: today.add(1, 'day').hour(13).minute(0).toDate(),
                  end: today.add(1, 'day').hour(17).minute(0).toDate(),
                  resourceId: 'r1',
                  background: 'rgba(59, 130, 246, 0.18)',
                },
              ],
              invalid: [
                {
                  start: today.hour(11).minute(0).toDate(),
                  end: today.hour(13).minute(0).toDate(),
                },
              ],
            },
          }}
        />
      </SchedulerStoryFrame>
    );
  },
};

export const AllDayAndMultiDay: Story = {
  render: () => {
    const today = dayjs().startOf('day');
    const events = [
      ...createSchedulerEvents(),
      {
        id: 'sched-allday-1',
        title: '全天值班',
        allDay: true,
        start: today.add(2, 'day').toDate(),
        end: today.add(2, 'day').endOf('day').toDate(),
        resourceId: 'r1',
        backgroundColor: '#0f766e',
        color: '#fff',
      },
      {
        id: 'sched-allday-2',
        title: '全天培训',
        allDay: true,
        start: today.add(4, 'day').toDate(),
        end: today.add(4, 'day').endOf('day').toDate(),
        resourceId: 'r3',
        backgroundColor: '#7c3aed',
        color: '#fff',
      },
      {
        id: 'sched-multiday-1',
        title: '跨天维保（r2）',
        category: 'time' as const,
        start: today.add(1, 'day').hour(20).minute(0).toDate(),
        end: today.add(3, 'day').hour(8).minute(0).toDate(),
        resourceId: 'r2',
        backgroundColor: '#b45309',
        color: '#fff',
      },
      {
        id: 'sched-multiday-2',
        title: '跨天项目（r4）',
        category: 'time' as const,
        start: today.add(3, 'day').hour(18).minute(0).toDate(),
        end: today.add(5, 'day').hour(10).minute(0).toDate(),
        resourceId: 'r4',
        backgroundColor: '#9f1239',
        color: '#fff',
      },
    ] satisfies EventObject[];

    return (
      <SchedulerStoryFrame>
        <Calendar
          events={events}
          options={{
            defaultView: 'scheduler',
            scheduler: {
              resources: RESOURCES,
              hourStart: 8,
              hourEnd: 20,
            },
          }}
        />
      </SchedulerStoryFrame>
    );
  },
};

export const DragTimeTooltipAndOrder: Story = {
  render: () => {
    const today = dayjs().startOf('day');
    const events = [
      {
        id: 'order-2',
        title: 'Order 2 - 右侧',
        category: 'time' as const,
        order: 2,
        start: today.hour(9).minute(0).toDate(),
        end: today.hour(11).minute(0).toDate(),
        resourceId: 'r1',
        backgroundColor: '#7c3aed',
        color: '#fff',
      },
      {
        id: 'order-1',
        title: 'Order 1 - 左侧',
        category: 'time' as const,
        order: 1,
        start: today.hour(9).minute(0).toDate(),
        end: today.hour(11).minute(0).toDate(),
        resourceId: 'r1',
        backgroundColor: '#0f766e',
        color: '#fff',
      },
      {
        id: 'tooltip-target',
        title: '拖拽或 resize 查看时间提示',
        category: 'time' as const,
        start: today.add(1, 'day').hour(13).minute(0).toDate(),
        end: today.add(1, 'day').hour(15).minute(0).toDate(),
        resourceId: 'r2',
        backgroundColor: '#b45309',
        color: '#fff',
      },
    ] satisfies EventObject[];

    return (
      <SchedulerStoryFrame>
        <Calendar
          events={events}
          options={{
            defaultView: 'scheduler',
            scheduler: {
              resources: RESOURCES,
              hourStart: 8,
              hourEnd: 20,
            },
          }}
        />
      </SchedulerStoryFrame>
    );
  },
};

export const Templates: Story = {
  render: function TemplatesStory() {
    const events = useMemo(() => createSchedulerEvents(TEMPLATE_RESOURCES, 4), []);

    return (
      <SchedulerStoryFrame>
        <Calendar
          events={events}
          options={{
            defaultView: 'scheduler',
            scheduler: {
              resources: TEMPLATE_RESOURCES,
              hourStart: 8,
              hourEnd: 20,
            },
            template: {
              schedulerDayHeader: ({ month, date, dayName }) => (
                <span style={{ fontWeight: 700, fontSize: 11 }}>
                  {month}.{date} / 周{dayName}
                </span>
              ),
              schedulerResourceHeader: ({ resourceName, resourceBackgroundColor }) => (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      flex: '0 0 8px',
                      width: 8,
                      minWidth: 8,
                      height: 8,
                      minHeight: 8,
                      borderRadius: '50%',
                      background: resourceBackgroundColor ?? '#3b82f6',
                    }}
                  />
                  <span title={resourceName} style={{ fontSize: 10 }}>
                    {resourceName}
                  </span>
                </>
              ),
              schedulerTime: ({ title, resourceId }) => (
                <span>
                  <strong>{resourceId}</strong> {title}
                </span>
              ),
            },
          }}
        />
      </SchedulerStoryFrame>
    );
  },
};

export const InteractionCallbacks: Story = {
  render: function InteractionCallbacksStory() {
    const [lastLog, setLastLog] = useState('等待交互');
    const events = useMemo(() => createSchedulerEvents(), []);
    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onCellClick: ({ start, resourceId }) => {
          setLastLog(`cell ${start.dayjs.format('MM-DD HH:mm')} @ ${resourceId ?? 'none'}`);
        },
        onEventHover: ({ event, hovering }) => {
          setLastLog(`${hovering ? 'enter' : 'leave'} ${event.title ?? event.id ?? 'untitled'}`);
        },
      }),
      []
    );

    return (
      <SchedulerStoryFrame>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.82)',
            color: '#fff',
            fontSize: 12,
          }}
        >
          {lastLog}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'scheduler',
            scheduler: {
              resources: RESOURCES,
              hourStart: 8,
              hourEnd: 20,
            },
          }}
        />
      </SchedulerStoryFrame>
    );
  },
};

const OVERLAP_RESOURCES = [
  { id: 'r1', name: '会议室 A', backgroundColor: '#3b82f6', color: '#fff' },
  { id: 'r2', name: '会议室 B', backgroundColor: '#10b981', color: '#fff' },
];

function makeDate(hour: number, minute = 0) {
  const today = new DayjsTZDate();
  return dayjs(today.getTime()).startOf('week').add(1, 'day').hour(hour).minute(minute).toDate();
}

const OVERLAP_EVENTS: EventObject[] = [
  {
    id: 'ov-1',
    title: '🔒 不可被覆盖 (overlap=false)',
    start: makeDate(9),
    end: makeDate(10),
    resourceId: 'r1',
    backgroundColor: '#ef4444',
    color: '#fff',
    overlap: false,
  },
  {
    id: 'ov-2',
    title: '✅ 允许重叠 (overlap=true)',
    start: makeDate(11),
    end: makeDate(12),
    resourceId: 'r1',
    backgroundColor: '#22c55e',
    color: '#fff',
    overlap: true,
  },
  {
    id: 'ov-3',
    title: '默认事件 (跟随全局)',
    start: makeDate(13),
    end: makeDate(14),
    resourceId: 'r1',
    backgroundColor: '#6366f1',
    color: '#fff',
  },
  {
    id: 'ov-4',
    title: '移动我到 r1 试试',
    start: makeDate(9),
    end: makeDate(10),
    resourceId: 'r2',
    backgroundColor: '#f59e0b',
    color: '#fff',
  },
];

export const OverlapPolicy: Story = {
  render: function OverlapPolicyStory() {
    const [events, setEvents] = useState<EventObject[]>(OVERLAP_EVENTS);
    const [log, setLog] = useState<string[]>(['操作日志（最新在上）']);

    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 6)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventUpdate: ({ event, previousEvent }) => {
          setEvents((cur) => cur.map((e) => (e.id === previousEvent.id ? { ...e, ...event } : e)));
          addLog(`✅ 移动成功: ${event.title ?? event.id}`);
        },
        onEventCreateFailed: ({ reason, event }) => {
          addLog(`❌ 创建失败 [${reason}]: ${event.title ?? event.id}`);
        },
        onEventUpdateFailed: ({ reason, event }) => {
          addLog(`❌ 移动失败 [${reason}]: ${event.title ?? event.id}`);
        },
      }),
      []
    );

    return (
      <SchedulerStoryFrame>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.88)',
            color: '#fff',
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 320,
          }}
        >
          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>
            全局 eventOverlap=false，per-event 可覆盖
          </div>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'scheduler',
            scheduler: {
              resources: OVERLAP_RESOURCES,
              hourStart: 8,
              hourEnd: 18,
              eventOverlap: false,
            },
          }}
        />
      </SchedulerStoryFrame>
    );
  },
};

const BUFFER_EVENTS: EventObject[] = [
  {
    id: 'buf-1',
    title: '⏱ bufferAfter=60min',
    start: makeDate(9),
    end: makeDate(10),
    resourceId: 'r1',
    backgroundColor: '#7c3aed',
    color: '#fff',
    bufferAfter: 60,
  },
  {
    id: 'buf-2',
    title: '⏱ bufferBefore=30min',
    start: makeDate(13),
    end: makeDate(14),
    resourceId: 'r1',
    backgroundColor: '#0891b2',
    color: '#fff',
    bufferBefore: 30,
  },
  {
    id: 'buf-3',
    title: '拖我到 r1 的缓冲区',
    start: makeDate(9),
    end: makeDate(10),
    resourceId: 'r2',
    backgroundColor: '#f59e0b',
    color: '#fff',
  },
];

export const BufferTimes: Story = {
  render: function BufferTimesStory() {
    const [events, setEvents] = useState<EventObject[]>(BUFFER_EVENTS);
    const [log, setLog] = useState<string[]>(['拖拽到缓冲区内会被拒绝']);

    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 6)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventUpdate: ({ event, previousEvent }) => {
          setEvents((cur) => cur.map((e) => (e.id === previousEvent.id ? { ...e, ...event } : e)));
          addLog(`✅ 移动成功: ${event.title ?? event.id}`);
        },
        onEventUpdateFailed: ({ reason, event }) => {
          addLog(`❌ 移动失败 [${reason}]: ${event.title ?? event.id}`);
        },
      }),
      []
    );

    return (
      <SchedulerStoryFrame>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.88)',
            color: '#fff',
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 320,
          }}
        >
          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>
            bufferAfter / bufferBefore 参与冲突判定
          </div>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'scheduler',
            scheduler: {
              resources: OVERLAP_RESOURCES,
              hourStart: 8,
              hourEnd: 18,
              eventOverlap: false,
            },
          }}
        />
      </SchedulerStoryFrame>
    );
  },
};

const DELETE_EVENTS: EventObject[] = [
  {
    id: 'del-1',
    title: '✅ 可删除（点击聚焦后按 Delete）',
    start: makeDate(9),
    end: makeDate(10),
    resourceId: 'r1',
    backgroundColor: '#3b82f6',
    color: '#fff',
    editable: true,
  },
  {
    id: 'del-2',
    title: '🔒 不可删除（editable=false）',
    start: makeDate(11),
    end: makeDate(12),
    resourceId: 'r1',
    backgroundColor: '#9ca3af',
    color: '#fff',
    editable: false,
  },
  {
    id: 'del-3',
    title: '✅ 可删除事件 2',
    start: makeDate(9),
    end: makeDate(10, 30),
    resourceId: 'r2',
    backgroundColor: '#10b981',
    color: '#fff',
  },
];

export const Delete: Story = {
  render: function DeleteStory() {
    const [events, setEvents] = useState<EventObject[]>(DELETE_EVENTS);
    const [log, setLog] = useState<string[]>(['点击事件聚焦，再按 Delete/Backspace']);

    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 6)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventDelete: ({ event }) => {
          setEvents((cur) => cur.filter((e) => e.id !== event.id));
          addLog(`🗑 已删除: ${event.title ?? event.id}`);
        },
        onEventUpdateFailed: ({ reason, policySource, event }) => {
          addLog(`❌ 删除失败 [${reason}/${policySource}]: ${event.title ?? event.id}`);
        },
      }),
      []
    );

    return (
      <SchedulerStoryFrame>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.88)',
            color: '#fff',
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 340,
          }}
        >
          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>
            聚焦事件卡片 → Delete / Backspace
          </div>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'scheduler',
            scheduler: {
              resources: OVERLAP_RESOURCES,
              hourStart: 8,
              hourEnd: 18,
            },
          }}
        />
      </SchedulerStoryFrame>
    );
  },
};
