import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { ReactNode, useMemo, useState } from 'react';
import { expect, fireEvent, fn, within } from 'storybook/test';

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
const onEventUpdateSpy = fn();
const onResizeUpdateSpy = fn();
const onEventCreateSpy = fn();
const onCreateCrossWeekSpy = fn();

function DragStoryFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>{children}</div>
    </div>
  );
}

function makeMonthEvent(overrides?: Partial<EventObject>): EventObject {
  return {
    id: 'month-move-1',
    calendarId: 'cal-1',
    title: '拖我到下周',
    start: dayjs('2026-06-10T09:00:00').toDate(),
    end: dayjs('2026-06-12T10:00:00').toDate(),
    backgroundColor: '#2563eb',
    color: '#fff',
    ...overrides,
  };
}

/**
 * MonthDragMove — 月视图跨周拖拽测试
 *
 * 验证将月视图事件向下拖到下一周，同步触发 onEventUpdate 且保持时长不变。
 */
export const MonthDragMove: Story = {
  name: '拖动换天',
  tags: ['month-drag'],
  render: function MonthDragMoveStory() {
    const [events, setEvents] = useState<EventObject[]>([makeMonthEvent()]);
    const [log, setLog] = useState<string[]>(['把事件拖到下一周同一列']);
    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 6)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventUpdate: (payload) => {
          setEvents((cur) =>
            cur.map((event) =>
              event.id === payload.event.id ? { ...event, ...payload.event } : event
            )
          );
          const nextStart = dayjs(payload.event.start as Date).format('MM-DD');
          addLog(`✅ 已换天: ${payload.event.title} → ${nextStart}`);
          onEventUpdateSpy(payload);
        },
      }),
      []
    );

    return (
      <DragStoryFrame>
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
          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>月视图 — 拖动换天</div>
          {log.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'month',
            initialDate: MONTH_INITIAL_DATE,
            month: {
              dragToMove: true,
            },
          }}
        />
      </DragStoryFrame>
    );
  },
  play: async ({ canvasElement, step }) => {
    onEventUpdateSpy.mockClear();
    await new Promise((resolve) => setTimeout(resolve, DEMO_PAUSE));
    const canvas = within(canvasElement);

    const eventCard = canvas.getByTestId('month-event-month-move-1');
    await expect(eventCard).toBeInTheDocument();
    const currentRow = eventCard.closest('.swell-calendar-month-week-row') as HTMLElement | null;
    await expect(currentRow).not.toBeNull();

    const rect = eventCard.getBoundingClientRect();
    const rowRect = currentRow!.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const nextWeekY = centerY + rowRect.height + 8;

    await step('向下拖到下一周', async () => {
      fireEvent.mouseDown(eventCard, { button: 0, clientX: centerX, clientY: centerY });
      await new Promise((resolve) => setTimeout(resolve, 50));
      fireEvent.mouseMove(document, { buttons: 1, clientX: centerX, clientY: centerY + 8 });
      await new Promise((resolve) => setTimeout(resolve, 16));
      fireEvent.mouseMove(document, { buttons: 1, clientX: centerX, clientY: nextWeekY });
      fireEvent.mouseUp(document, { clientX: centerX, clientY: nextWeekY });
    });

    await step('断言回调收到新的起止日期', async () => {
      await expect(onEventUpdateSpy).toHaveBeenCalled();
      const payload = onEventUpdateSpy.mock.calls.at(-1)?.[0];
      expect(dayjs(payload.event.start as Date).format('YYYY-MM-DD')).toBe('2026-06-17');
      expect(dayjs(payload.event.end as Date).format('YYYY-MM-DD')).toBe('2026-06-19');
    });
  },
};

/**
 * MonthDragResize — 月视图右边 resize 测试
 *
 * 验证拖动右边缘延长结束日期，只改 end 不改 start。
 */
export const MonthDragResize: Story = {
  name: '拖拽调整跨度',
  tags: ['month-drag'],
  render: function MonthDragResizeStory() {
    const [events, setEvents] = useState<EventObject[]>([
      makeMonthEvent({
        id: 'month-resize-1',
        title: '拉右边延长两天',
      }),
    ]);
    const [log, setLog] = useState<string[]>(['拖动右边缘，把事件延长到周日']);
    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 6)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventUpdate: (payload) => {
          setEvents((cur) =>
            cur.map((event) =>
              event.id === payload.event.id ? { ...event, ...payload.event } : event
            )
          );
          const nextEnd = dayjs(payload.event.end as Date).format('MM-DD');
          addLog(`✅ 已延长: ${payload.event.title} → ${nextEnd}`);
          onResizeUpdateSpy(payload);
        },
      }),
      []
    );

    return (
      <DragStoryFrame>
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
            月视图 — 拖拽调整跨度
          </div>
          {log.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'month',
            initialDate: MONTH_INITIAL_DATE,
            month: {
              dragToMove: true,
              dragToResize: true,
            },
          }}
        />
      </DragStoryFrame>
    );
  },
  play: async ({ canvasElement, step }) => {
    onResizeUpdateSpy.mockClear();
    await new Promise((resolve) => setTimeout(resolve, DEMO_PAUSE));
    const canvas = within(canvasElement);

    const resizeHandle = canvas.getByTestId('month-resize-end-month-resize-1');
    await expect(resizeHandle).toBeInTheDocument();
    const currentRow = resizeHandle.closest('.swell-calendar-month-week-row') as HTMLElement | null;
    await expect(currentRow).not.toBeNull();

    const rect = resizeHandle.getBoundingClientRect();
    const rowRect = currentRow!.getBoundingClientRect();
    const colWidth = rowRect.width / 7;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // 06-12(周五) -> 06-14(周日) 是跨周 resize，真实落点应命中下一周首列中心。
    const targetX = rowRect.left + colWidth * 0.5;
    const targetY = rowRect.top + rowRect.height * 1.5;

    await step('拖到下一周周日，跨周延长两天', async () => {
      fireEvent.mouseDown(resizeHandle, { button: 0, clientX: centerX, clientY: centerY });
      await new Promise((resolve) => setTimeout(resolve, 50));
      fireEvent.mouseMove(document, { buttons: 1, clientX: centerX + 8, clientY: centerY });
      await new Promise((resolve) => setTimeout(resolve, 16));
      fireEvent.mouseMove(document, { buttons: 1, clientX: targetX, clientY: targetY });
      fireEvent.mouseUp(document, { clientX: targetX, clientY: targetY });
    });

    await step('断言只更新结束日期', async () => {
      await expect(onResizeUpdateSpy).toHaveBeenCalled();
      const payload = onResizeUpdateSpy.mock.calls.at(-1)?.[0];
      expect(dayjs(payload.event.start as Date).format('YYYY-MM-DD')).toBe('2026-06-10');
      expect(dayjs(payload.event.end as Date).format('YYYY-MM-DD')).toBe('2026-06-14');
    });
  },
};

/**
 * MonthDragCreate — 月视图空白拖拽创建测试
 *
 * 验证在空白日期格子横向框选生成跨天全天事件，触发 onEventCreate。
 */
export const MonthDragCreate: Story = {
  name: '空白拖拽创建',
  tags: ['month-drag'],
  render: function MonthDragCreateStory() {
    const [events, setEvents] = useState<EventObject[]>([]);
    const [log, setLog] = useState<string[]>(['在第一周空白格里横向框选创建事件']);
    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 6)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventCreate: (payload) => {
          const created: EventObject = {
            id: `month-created-${Date.now()}`,
            calendarId: 'cal-1',
            title: '新建事件',
            backgroundColor: '#16a34a',
            color: '#fff',
            ...payload.event,
          };
          setEvents((cur) => [...cur, created]);
          const s = dayjs(payload.event.start as Date).format('MM-DD');
          const e = dayjs(payload.event.end as Date).format('MM-DD');
          addLog(`✅ 已创建: ${s} → ${e}`);
          onEventCreateSpy(payload);
        },
      }),
      []
    );

    return (
      <DragStoryFrame>
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
            月视图 — 空白拖拽创建
          </div>
          {log.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'month',
            initialDate: MONTH_INITIAL_DATE,
            month: {
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

    const firstRow = canvasElement.querySelector(
      '.swell-calendar-month-week-row'
    ) as HTMLElement | null;
    await expect(firstRow).not.toBeNull();

    // 首周（2026 年 6 月 1 日所在周）：列 0=5/31 … 列 2=6/2 … 列 4=6/4。
    const rowRect = firstRow!.getBoundingClientRect();
    const colWidth = rowRect.width / 7;
    const startX = rowRect.left + colWidth * 2 + colWidth / 2;
    const endX = rowRect.left + colWidth * 4 + colWidth / 2;
    const y = rowRect.top + rowRect.height * 0.7;

    await step('从 6/2 横向框选到 6/4', async () => {
      fireEvent.mouseDown(firstRow!, { button: 0, clientX: startX, clientY: y });
      await new Promise((resolve) => setTimeout(resolve, 50));
      fireEvent.mouseMove(document, { buttons: 1, clientX: startX + 8, clientY: y });
      await new Promise((resolve) => setTimeout(resolve, 16));
      fireEvent.mouseMove(document, { buttons: 1, clientX: endX, clientY: y });
      fireEvent.mouseUp(document, { clientX: endX, clientY: y });
    });

    await step('断言创建出 6/2–6/4 的全天事件', async () => {
      await expect(onEventCreateSpy).toHaveBeenCalled();
      const payload = onEventCreateSpy.mock.calls.at(-1)?.[0];
      expect(payload.event.allDay).toBe(true);
      expect(dayjs(payload.event.start as Date).format('YYYY-MM-DD')).toBe('2026-06-02');
      expect(dayjs(payload.event.end as Date).format('YYYY-MM-DD')).toBe('2026-06-04');
    });
  },
};

/**
 * MonthDragCreateCrossWeek — 跨周（换行）空白拖拽创建测试
 *
 * 从某周末尾向下一周框选，验证：
 * 1. 拖拽过程中占位阴影按周切成多段（每个所在周各一段）；
 * 2. mouseup 后创建出跨周的全天事件。
 */
export const MonthDragCreateCrossWeek: Story = {
  name: '跨周空白拖拽创建',
  tags: ['month-drag'],
  render: function MonthDragCreateCrossWeekStory() {
    const [events, setEvents] = useState<EventObject[]>([]);
    const [log, setLog] = useState<string[]>(['从第三周末尾向第四周框选，跨周创建']);
    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 6)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventCreate: (payload) => {
          const created: EventObject = {
            id: `month-xweek-${Date.now()}`,
            calendarId: 'cal-1',
            title: '跨周事件',
            backgroundColor: '#16a34a',
            color: '#fff',
            ...payload.event,
          };
          setEvents((cur) => [...cur, created]);
          const s = dayjs(payload.event.start as Date).format('MM-DD');
          const e = dayjs(payload.event.end as Date).format('MM-DD');
          addLog(`✅ 已创建: ${s} → ${e}`);
          onCreateCrossWeekSpy(payload);
        },
      }),
      []
    );

    return (
      <DragStoryFrame>
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
          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>月视图 — 跨周创建</div>
          {log.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'month',
            initialDate: MONTH_INITIAL_DATE,
            month: { dragToCreate: true },
          }}
        />
      </DragStoryFrame>
    );
  },
  play: async ({ canvasElement, step }) => {
    onCreateCrossWeekSpy.mockClear();
    await new Promise((resolve) => setTimeout(resolve, DEMO_PAUSE));

    const rows = canvasElement.querySelectorAll<HTMLElement>('.swell-calendar-month-week-row');
    await expect(rows.length).toBeGreaterThan(4);
    // rows[3] = 6/21(日)–6/27(六)，rows[4] = 6/28(日)–7/4(六)
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
      await expect(onCreateCrossWeekSpy).toHaveBeenCalled();
      const payload = onCreateCrossWeekSpy.mock.calls.at(-1)?.[0];
      expect(payload.event.allDay).toBe(true);
      expect(dayjs(payload.event.start as Date).format('YYYY-MM-DD')).toBe('2026-06-25');
      expect(dayjs(payload.event.end as Date).format('YYYY-MM-DD')).toBe('2026-06-29');
    });
  },
};

/**
 * MonthEventOverflow — 单元格事件占满后的溢出展示
 *
 * 同一天塞入超过 visibleEventCount 的事件，验证多出的事件折叠为「+N 更多」。
 */
export const MonthEventOverflow: Story = {
  name: '占满后溢出展示',
  tags: ['month-overflow'],
  render: function MonthEventOverflowStory() {
    // 同一天塞 7 个事件；月视图当前每格最多显示 4 个，其余折叠为「+N 更多」
    const events = useMemo<EventObject[]>(
      () =>
        Array.from({ length: 7 }, (_, i) => ({
          id: `overflow-${i}`,
          calendarId: 'cal-1',
          title: `事件 ${i + 1}`,
          category: 'allday',
          allDay: true,
          start: dayjs('2026-06-09T00:00:00').toDate(),
          end: dayjs('2026-06-09T23:59:59').toDate(),
          backgroundColor: '#2563eb',
          color: '#fff',
        })),
      []
    );

    return (
      <DragStoryFrame>
        <Calendar
          events={events}
          options={{
            defaultView: 'month',
            initialDate: MONTH_INITIAL_DATE,
          }}
        />
      </DragStoryFrame>
    );
  },
  play: async ({ canvasElement, step }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    await step('断言可见事件被裁到上限，其余折叠为「+N 更多」', async () => {
      const cards = canvasElement.querySelectorAll('[data-testid^="month-event-overflow-"]');
      // 7 个事件、每格最多 4 个 → 显示 4 个，溢出 3 个
      expect(cards.length).toBe(4);
      const more = canvasElement.querySelector('.swell-calendar-month-more');
      await expect(more).not.toBeNull();
      expect(more!.textContent).toContain('+3');
      expect(more!.textContent).toContain('更多');
    });
  },
};
