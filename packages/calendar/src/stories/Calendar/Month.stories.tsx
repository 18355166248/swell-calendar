import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { ReactNode, useMemo, useState } from 'react';
import { expect, fireEvent, fn } from 'storybook/test';

import { Calendar } from '@/components/Calendar';
import { CalendarCallbacks } from '@/types/callbacks.type';
import { EventObject } from '@/types/events.type';

const meta = {
  title: '日历/视图/月视图',
  component: Calendar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: [],
  argTypes: {},
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 演示模式下每步停顿，可通过 SLOWMO 覆盖 */
const DEMO_PAUSE = 2000;
const MONTH_INITIAL_DATE = '2026-06-01';
const onEventCreateSpy = fn();
const onEventUpdateSpy = fn();

function DragStoryFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>{children}</div>
    </div>
  );
}

/** 预置事件：拖拽交互 + 溢出 + 窄周末跨条 */
const INITIAL_EVENTS: EventObject[] = [
  // 拖拽交互演示
  {
    id: 'demo-move-1',
    calendarId: 'cal-1',
    title: '可拖动换天',
    start: dayjs('2026-06-09T09:00:00').toDate(),
    end: dayjs('2026-06-11T10:00:00').toDate(),
    backgroundColor: '#2563eb',
    color: '#fff',
  },
  {
    id: 'demo-resize-1',
    calendarId: 'cal-1',
    title: '可拖右边缘',
    start: dayjs('2026-06-15T00:00:00').toDate(),
    end: dayjs('2026-06-17T23:59:59').toDate(),
    backgroundColor: '#9333ea',
    color: '#fff',
  },
  // 溢出演示：同一天塞 7 个事件
  ...(Array.from({ length: 7 }, (_, i) => ({
    id: `overflow-${i}`,
    calendarId: 'cal-1',
    title: `事件 ${i + 1}`,
    category: 'allday',
    allDay: true,
    start: dayjs('2026-06-09T00:00:00').toDate(),
    end: dayjs('2026-06-09T23:59:59').toDate(),
    backgroundColor: '#2563eb',
    color: '#fff',
  })) as EventObject[]),
  // 窄周末跨条演示
  {
    id: 'narrow-weekday',
    calendarId: 'cal-1',
    title: '工作日跨条',
    category: 'allday',
    allDay: true,
    start: dayjs('2026-06-08T00:00:00').toDate(),
    end: dayjs('2026-06-12T23:59:59').toDate(),
    backgroundColor: '#ea580c',
    color: '#fff',
  },
];

/**
 * MonthView — 月视图综合演示
 *
 * 同时展示拖拽移动 / resize / 空白创建、溢出折叠（+N 更多）、窄周末列宽。
 * 右上角面板提供窄周末开关，实时切换列宽模式。
 */
export const MonthView: Story = {
  name: '月视图',
  render: function MonthViewStory() {
    const [events, setEvents] = useState<EventObject[]>(INITIAL_EVENTS);
    const [narrowWeekend, setNarrowWeekend] = useState(false);
    const [log, setLog] = useState<string[]>(['拖拽换天 / 拉边缘 / 空白创建 / 溢出 +N 更多']);
    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 8)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventUpdate: (payload) => {
          setEvents((cur) =>
            cur.map((event) =>
              event.id === payload.event.id ? { ...event, ...payload.event } : event
            )
          );
          const s = dayjs(payload.event.start as Date).format('MM-DD');
          const e = dayjs(payload.event.end as Date).format('MM-DD');
          addLog(`✅ 更新: ${payload.event.title} → ${s} ~ ${e}`);
          onEventUpdateSpy(payload);
        },
        onEventCreate: (payload) => {
          const created: EventObject = {
            id: `demo-created-${Date.now()}`,
            calendarId: 'cal-1',
            title: '新建事件',
            backgroundColor: '#16a34a',
            color: '#fff',
            ...payload.event,
          };
          setEvents((cur) => [...cur, created]);
          const s = dayjs(payload.event.start as Date).format('MM-DD');
          const e = dayjs(payload.event.end as Date).format('MM-DD');
          addLog(`✅ 创建: ${s} → ${e}`);
          onEventCreateSpy(payload);
        },
      }),
      []
    );

    const panelStyle: React.CSSProperties = {
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
    };

    const toggleStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      paddingTop: 8,
      borderTop: '1px solid rgba(255,255,255,0.15)',
      cursor: 'pointer',
      userSelect: 'none',
    };

    const switchTrackStyle: React.CSSProperties = {
      width: 32,
      height: 18,
      borderRadius: 9,
      background: narrowWeekend ? '#22c55e' : 'rgba(255,255,255,0.25)',
      position: 'relative',
      transition: 'background 0.2s',
      flexShrink: 0,
    };

    const switchThumbStyle: React.CSSProperties = {
      width: 14,
      height: 14,
      borderRadius: 7,
      background: '#fff',
      position: 'absolute',
      top: 2,
      left: narrowWeekend ? 16 : 2,
      transition: 'left 0.2s',
    };

    return (
      <DragStoryFrame>
        <div style={panelStyle}>
          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>月视图交互</div>
          {log.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
          <div
            style={toggleStyle}
            role="switch"
            aria-checked={narrowWeekend}
            tabIndex={0}
            onClick={() => setNarrowWeekend((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setNarrowWeekend((v) => !v);
              }
            }}
          >
            <div style={switchTrackStyle}>
              <div style={switchThumbStyle} />
            </div>
            <span>窄周末</span>
          </div>
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'month',
            initialDate: MONTH_INITIAL_DATE,
            month: {
              narrowWeekend,
              dragToMove: true,
              dragToResize: true,
              dragToCreate: true,
            },
          }}
        />
      </DragStoryFrame>
    );
  },
  play: async ({ canvasElement, step }) => {
    onEventCreateSpy.mockClear();
    await new Promise((resolve) => setTimeout(resolve, DEMO_PAUSE));

    const rows = canvasElement.querySelectorAll<HTMLElement>('.swell-calendar-month-week-row');
    await expect(rows.length).toBeGreaterThan(4);
    const r3 = rows[3].getBoundingClientRect();
    const r4 = rows[4].getBoundingClientRect();
    const colW = r3.width / 7;
    const startX = r3.left + colW * 4 + colW / 2; // 6/25
    const startY = r3.top + r3.height * 0.6;
    const endX = r4.left + colW * 1 + colW / 2; // 6/29
    const endY = r4.top + r4.height * 0.6;

    await step('从 6/25 跨周拖到 6/29，断言占位阴影分两段', async () => {
      fireEvent.mouseDown(rows[3], { button: 0, clientX: startX, clientY: startY });
      await new Promise((resolve) => setTimeout(resolve, 60));
      fireEvent.mouseMove(document, { buttons: 1, clientX: startX + 10, clientY: startY });
      await new Promise((resolve) => setTimeout(resolve, 40));
      fireEvent.mouseMove(document, { buttons: 1, clientX: endX, clientY: endY });
      await new Promise((resolve) => setTimeout(resolve, 40));
      const ghosts = canvasElement.querySelectorAll('.swell-calendar-month-event-ghost');
      expect(ghosts.length).toBe(2);
      fireEvent.mouseUp(document, { clientX: endX, clientY: endY });
    });

    await step('断言创建出 6/25–6/29 的跨周全天事件', async () => {
      await expect(onEventCreateSpy).toHaveBeenCalled();
      const payload = onEventCreateSpy.mock.calls.at(-1)?.[0];
      expect(payload.event.allDay).toBe(true);
      expect(dayjs(payload.event.start as Date).format('YYYY-MM-DD')).toBe('2026-06-25');
      expect(dayjs(payload.event.end as Date).format('YYYY-MM-DD')).toBe('2026-06-29');
    });
  },
};
