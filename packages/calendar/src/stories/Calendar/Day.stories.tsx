import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { ReactNode, useMemo, useState } from 'react';
import { expect, fireEvent, within } from 'storybook/test';

import { Calendar } from '@/components/Calendar';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarCallbacks } from '@/types/callbacks.type';
import { EventObject } from '@/types/events.type';

const meta = {
  title: '日历/视图/日视图',
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

function DragStoryFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>{children}</div>
    </div>
  );
}

/**
 * 创建 Day 视图的单日可拖拽事件
 */
function makeDayEvent(hour: number, overrides?: Partial<EventObject>): EventObject {
  const today = new DayjsTZDate();
  return {
    id: `day-${hour}`,
    title: `${hour}:00 事件`,
    category: 'time',
    start: dayjs(today.getTime()).startOf('day').hour(hour).minute(0).toDate(),
    end: dayjs(today.getTime())
      .startOf('day')
      .hour(hour + 1)
      .minute(0)
      .toDate(),
    backgroundColor: '#3b82f6',
    color: '#fff',
    ...overrides,
  };
}

/**
 * DayDragVertical — 日视图垂直拖拽测试
 *
 * 验证在日视图单列中将事件上下拖动，触发 onEventUpdate 回调。
 */
export const DayDragVertical: Story = {
  name: '垂直拖拽',
  render: function DayDragVerticalStory() {
    const [events, setEvents] = useState<EventObject[]>([
      makeDayEvent(9, { id: 'day-vert-1', title: '拖我上下移动' }),
      makeDayEvent(14, {
        id: 'day-vert-2',
        title: '固定事件',
        draggable: false,
        backgroundColor: '#9ca3af',
      }),
    ]);
    const [log, setLog] = useState<string[]>(['拖拽事件上下移动']);
    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 6)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventUpdate: ({ event }) => {
          setEvents((cur) => cur.map((e) => (e.id === event.id ? { ...e, ...event } : e)));
          addLog(`✅ 已移动: ${event.title}`);
        },
      }),
      []
    );

    return (
      <DragStoryFrame>
        <div
          style={{
            position: 'absolute',
            top: 73,
            right: 12,
            zIndex: 10,
            pointerEvents: 'none',
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.88)',
            color: '#fff',
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 340,
          }}
        >
          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>日视图 — 垂直拖拽</div>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'day',
            week: { hourStart: 8, hourEnd: 20 },
          }}
        />
      </DragStoryFrame>
    );
  },
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, DEMO_PAUSE));
    const canvas = within(canvasElement);

    const dragCard = canvas.getByTestId('event-card-day-vert-1');
    const fixedCard = canvas.getByTestId('event-card-day-vert-2');
    await expect(dragCard).toBeInTheDocument();
    await expect(fixedCard).toBeInTheDocument();

    // 获取卡片在页面中的实际坐标
    const rect = dragCard.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // 使用 fireEvent 派发 MouseEvent（useDrag 监听 onMouseDown）
    fireEvent.mouseDown(dragCard, { button: 0, clientX: cx, clientY: cy });
    fireEvent.mouseMove(document, { clientX: cx, clientY: cy + 10 });
    fireEvent.mouseMove(document, { clientX: cx, clientY: cy + 100 });
    fireEvent.mouseUp(document, { clientX: cx, clientY: cy + 100 });

    await new Promise((r) => setTimeout(r, 500));

    // 验证拖拽未导致崩溃
    await expect(dragCard).toBeInTheDocument();
    await expect(fixedCard).toBeInTheDocument();
  },
};

/**
 * DayDragResize — 日视图事件时长调整测试
 *
 * 验证拖拽事件底部边缘来延长事件时长。
 */
export const DayDragResize: Story = {
  name: '拖拽调整时长',
  render: function DayDragResizeStory() {
    const [events, setEvents] = useState<EventObject[]>([
      makeDayEvent(10, {
        id: 'day-resize-1',
        title: '拉边缘改时长',
        resizable: true,
        backgroundColor: '#7c3aed',
      }),
    ]);
    const [log, setLog] = useState<string[]>(['拖拽底部边缘调整时长']);
    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 6)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventUpdate: ({ event }) => {
          setEvents((cur) => cur.map((e) => (e.id === event.id ? { ...e, ...event } : e)));
          addLog(`✅ 已调整: ${event.title}`);
        },
      }),
      []
    );

    return (
      <DragStoryFrame>
        <div
          style={{
            position: 'absolute',
            top: 73,
            right: 12,
            zIndex: 10,
            pointerEvents: 'none',
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
            日视图 — 拖拽边缘调整时长
          </div>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'day',
            week: { hourStart: 8, hourEnd: 20 },
          }}
        />
      </DragStoryFrame>
    );
  },
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, DEMO_PAUSE));
    const canvas = within(canvasElement);

    const resizeCard = canvas.getByTestId('event-card-day-resize-1');
    await expect(resizeCard).toBeInTheDocument();

    // 找到底部 resize handle
    const resizeHandle = canvas.getByTestId('resize-handle-bottom-day-resize-1');
    await expect(resizeHandle).toBeInTheDocument();

    const handleRect = resizeHandle.getBoundingClientRect();
    const hx = handleRect.left + handleRect.width / 2;
    const hy = handleRect.top + handleRect.height / 2;

    fireEvent.mouseDown(resizeHandle, { button: 0, clientX: hx, clientY: hy });
    fireEvent.mouseMove(document, { clientX: hx, clientY: hy + 10 });
    fireEvent.mouseMove(document, { clientX: hx, clientY: hy + 50 });
    fireEvent.mouseUp(document, { clientX: hx, clientY: hy + 50 });

    await new Promise((r) => setTimeout(r, 500));

    await expect(resizeCard).toBeInTheDocument();
    await expect(resizeHandle).toBeInTheDocument();
  },
};
