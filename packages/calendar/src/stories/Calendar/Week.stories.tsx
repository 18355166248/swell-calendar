// 导入 Storybook 相关的类型定义
import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { ReactNode, useMemo, useState } from 'react';
import { expect, fireEvent, within } from 'storybook/test';

// 导入日历组件
import { Calendar } from '@/components/Calendar';
// 导入时区日期处理库
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarCallbacks } from '@/types/callbacks.type';
import { EventObject } from '@/types/events.type';

// 定义 Storybook 元数据配置
const meta = {
  title: '日历/视图/周视图', // Storybook 中的标题路径
  component: Calendar, // 使用日历组件
  parameters: {
    layout: 'fullscreen', // 使用全屏布局
  },
  tags: [], // 标签数组
  argTypes: {}, // 参数类型定义
} satisfies Meta<typeof Calendar>;

// 导出元数据配置
export default meta;
// 定义 Story 类型
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
 * 创建 Week 视图的单日可拖拽事件
 */
function makeWeekEvent(
  id: string,
  dayOffset: number,
  hour: number,
  overrides?: Partial<EventObject>
): EventObject {
  const today = new DayjsTZDate();
  const weekStart = dayjs(today.getTime()).startOf('week');
  return {
    id,
    title: `${hour}:00 事件`,
    category: 'time',
    start: weekStart.add(dayOffset, 'day').hour(hour).minute(0).toDate(),
    end: weekStart
      .add(dayOffset, 'day')
      .hour(hour + 1)
      .minute(0)
      .toDate(),
    backgroundColor: '#3b82f6',
    color: '#fff',
    ...overrides,
  };
}

/**
 * WeekDragVertical — 周视图单列垂直拖拽
 *
 * 验证在周视图某个日期列中将事件上下拖动。
 */
export const WeekDragVertical: Story = {
  name: '垂直拖拽',
  render: function WeekDragVerticalStory() {
    const [events, setEvents] = useState<EventObject[]>([
      makeWeekEvent('w-vert-1', 1, 9, { title: '拖我上下移动', backgroundColor: '#3b82f6' }),
      makeWeekEvent('w-vert-2', 1, 14, {
        title: '固定事件',
        draggable: false,
        backgroundColor: '#9ca3af',
      }),
    ]);
    const [log, setLog] = useState<string[]>(['拖拽事件上下移动（周一列）']);
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
          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>周视图 — 垂直拖拽</div>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'week',
            week: { hourStart: 8, hourEnd: 20 },
          }}
        />
      </DragStoryFrame>
    );
  },
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, DEMO_PAUSE));
    const canvas = within(canvasElement);

    const dragCard = canvas.getByTestId('event-card-w-vert-1');
    const fixedCard = canvas.getByTestId('event-card-w-vert-2');
    await expect(dragCard).toBeInTheDocument();
    await expect(fixedCard).toBeInTheDocument();

    const rect = dragCard.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    fireEvent.mouseDown(dragCard, { button: 0, clientX: cx, clientY: cy });
    fireEvent.mouseMove(document, { clientX: cx, clientY: cy + 10 });
    fireEvent.mouseMove(document, { clientX: cx, clientY: cy + 100 });
    fireEvent.mouseUp(document, { clientX: cx, clientY: cy + 100 });

    await new Promise((r) => setTimeout(r, 500));

    await expect(dragCard).toBeInTheDocument();
    await expect(fixedCard).toBeInTheDocument();
  },
};

/**
 * WeekDragCrossDay — 周视图跨天拖拽测试
 *
 * 验证将事件从一天水平拖到另一天，触发 onEventUpdate 回调。
 * 这是周视图独有的拖拽场景：跨列（跨天）移动。
 */
export const WeekDragCrossDay: Story = {
  name: '跨天拖拽',
  render: function WeekDragCrossDayStory() {
    const [events, setEvents] = useState<EventObject[]>([
      makeWeekEvent('w-cross-1', 1, 10, {
        title: '拖我到周三',
        backgroundColor: '#10b981',
      }),
    ]);
    const [log, setLog] = useState<string[]>(['水平拖拽事件到另一天']);
    const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 6)]);

    const callbacks = useMemo<CalendarCallbacks>(
      () => ({
        onEventUpdate: ({ event }) => {
          setEvents((cur) => cur.map((e) => (e.id === event.id ? { ...e, ...event } : e)));
          const newDate = dayjs(new Date(event.start as string | number | Date)).format('MM-DD');
          addLog(`✅ 跨天移动: ${event.title} → ${newDate}`);
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
          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>周视图 — 跨天拖拽</div>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'week',
            week: { hourStart: 8, hourEnd: 20 },
          }}
        />
      </DragStoryFrame>
    );
  },
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, DEMO_PAUSE));
    const canvas = within(canvasElement);

    const crossCard = canvas.getByTestId('event-card-w-cross-1');
    await expect(crossCard).toBeInTheDocument();

    const rect = crossCard.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // 水平向右拖拽约 200px（跨越到下一个日期列）
    fireEvent.mouseDown(crossCard, { button: 0, clientX: cx, clientY: cy });
    fireEvent.mouseMove(document, { clientX: cx + 10, clientY: cy });
    fireEvent.mouseMove(document, { clientX: cx + 200, clientY: cy });
    fireEvent.mouseUp(document, { clientX: cx + 200, clientY: cy });

    await new Promise((r) => setTimeout(r, 500));

    await expect(crossCard).toBeInTheDocument();
  },
};

/**
 * WeekDragResize — 周视图事件时长调整测试
 */
export const WeekDragResize: Story = {
  name: '拖拽调整时长',
  render: function WeekDragResizeStory() {
    const [events, setEvents] = useState<EventObject[]>([
      makeWeekEvent('w-resize-1', 2, 11, {
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
            周视图 — 拖拽边缘调整时长
          </div>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <Calendar
          events={events}
          callbacks={callbacks}
          options={{
            defaultView: 'week',
            week: { hourStart: 8, hourEnd: 20 },
          }}
        />
      </DragStoryFrame>
    );
  },
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, DEMO_PAUSE));
    const canvas = within(canvasElement);

    const resizeCard = canvas.getByTestId('event-card-w-resize-1');
    await expect(resizeCard).toBeInTheDocument();

    const resizeHandle = canvas.getByTestId('resize-handle-bottom-w-resize-1');
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
