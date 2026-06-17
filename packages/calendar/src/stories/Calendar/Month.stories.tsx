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
