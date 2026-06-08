import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TimelineInteractionProvider,
  TimelineInteractionValue,
} from '@/components/timeline/TimelineInteractionContext';
import { CalendarStoreProvider, createCalendarStore } from '@/contexts/calendarStore';
import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';

import { useTimelineCreate } from './useTimelineCreate';
import { useTimelineEventDrag } from './useTimelineEventDrag';

/**
 * timeline 交互 hooks 的回归测试：
 * - move / resize / create 在 mouseup 经几何计算后提交对应 commit
 * - 拖拽中按 ESC：清除预览（setDragPreview(null)）且不提交，trailing mouseup 也不再提交
 *
 * 锁住此前仅靠浏览器验证的 onPressESCKey 接线，避免共享底座（useDrag）改动悄悄退化。
 */

const CELL_WIDTH = 80;

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function makeEventUIModel(id: string) {
  return new EventUIModel(
    new EventModel({
      id,
      title: id,
      category: 'time',
      start: new Date('2026-06-02T09:00:00'),
      end: new Date('2026-06-06T18:00:00'),
      resourceId: 'r1',
    })
  );
}

function makeInteractionValue(
  overrides: Partial<TimelineInteractionValue> = {}
): TimelineInteractionValue {
  return {
    cellWidth: CELL_WIDTH,
    dayCount: 30,
    // 按 client x/y 反推网格位置：dayIndex 按 cellWidth 取整，resourceIndex 固定 0
    gridPositionFinder: vi.fn((clientX: number) => ({
      dayIndex: Math.round(clientX / CELL_WIDTH),
      resourceIndex: 0,
    })),
    setDragPreview: vi.fn(),
    commitMove: vi.fn(),
    commitResize: vi.fn(),
    commitCreate: vi.fn(),
    ...overrides,
  };
}

describe('timeline interaction hooks', () => {
  let container: HTMLDivElement;
  let root: Root;
  let store: ReturnType<typeof createCalendarStore>;
  let interaction: TimelineInteractionValue;

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    store = createCalendarStore();
    interaction = makeInteractionValue();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
  });

  function mount(ui: React.ReactNode) {
    act(() => {
      root.render(
        <CalendarStoreProvider store={store}>
          <TimelineInteractionProvider value={interaction}>{ui}</TimelineInteractionProvider>
        </CalendarStoreProvider>
      );
    });
  }

  function down(testid: string, init: MouseEventInit) {
    const el = container.querySelector(`[data-testid="${testid}"]`);
    if (!el) throw new Error(`target ${testid} not found`);
    act(() => el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, ...init })));
  }

  function moveDoc(init: MouseEventInit) {
    act(() => document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, ...init })));
  }

  function upDoc(init: MouseEventInit) {
    act(() => document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, ...init })));
  }

  function escDoc() {
    act(() =>
      document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }))
    );
  }

  // ---- move ----
  function MoveHarness() {
    const { onMoveStart } = useTimelineEventDrag({
      uiModel: makeEventUIModel('m-1'),
      resourceIndex: 0,
      startDayIndex: 1,
      endDayIndex: 5,
    });
    return <div data-testid="move" onMouseDown={onMoveStart} />;
  }

  it('move：mouseup 按 dayDelta 提交 commitMove', () => {
    mount(<MoveHarness />);
    down('move', { button: 0, buttons: 1, clientX: 100, clientY: 10 });
    moveDoc({ button: 0, buttons: 1, clientX: 260, clientY: 10 }); // +160px / 80 = +2 天
    upDoc({ button: 0, buttons: 0, clientX: 260, clientY: 10 });

    expect(interaction.commitMove).toHaveBeenCalledTimes(1);
    const [, dayDelta, targetResourceIndex] = (interaction.commitMove as ReturnType<typeof vi.fn>)
      .mock.calls[0];
    expect(dayDelta).toBe(2);
    expect(targetResourceIndex).toBe(0);
  });

  it('move：ESC 取消 → 清预览、不提交，trailing mouseup 也不提交', () => {
    mount(<MoveHarness />);
    down('move', { button: 0, buttons: 1, clientX: 100, clientY: 10 });
    moveDoc({ button: 0, buttons: 1, clientX: 260, clientY: 10 });
    escDoc();

    expect(interaction.setDragPreview).toHaveBeenCalledWith(null);
    expect(interaction.commitMove).not.toHaveBeenCalled();

    upDoc({ button: 0, buttons: 0, clientX: 260, clientY: 10 });
    expect(interaction.commitMove).not.toHaveBeenCalled();
  });

  // ---- resize ----
  function ResizeHarness() {
    const { onResizeEndStart } = useTimelineEventDrag({
      uiModel: makeEventUIModel('r-1'),
      resourceIndex: 0,
      startDayIndex: 1,
      endDayIndex: 5,
    });
    return <div data-testid="resize-end" onMouseDown={onResizeEndStart} />;
  }

  it('resize：mouseup 按 dayDelta 提交 commitResize(end)', () => {
    mount(<ResizeHarness />);
    down('resize-end', { button: 0, buttons: 1, clientX: 100, clientY: 10 });
    moveDoc({ button: 0, buttons: 1, clientX: 340, clientY: 10 }); // +240px / 80 = +3 天
    upDoc({ button: 0, buttons: 0, clientX: 340, clientY: 10 });

    expect(interaction.commitResize).toHaveBeenCalledTimes(1);
    const [, edge, dayDelta] = (interaction.commitResize as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(edge).toBe('end');
    expect(dayDelta).toBe(3);
  });

  it('resize：ESC 取消 → 清预览、不提交', () => {
    mount(<ResizeHarness />);
    down('resize-end', { button: 0, buttons: 1, clientX: 100, clientY: 10 });
    moveDoc({ button: 0, buttons: 1, clientX: 340, clientY: 10 });
    escDoc();

    expect(interaction.setDragPreview).toHaveBeenCalledWith(null);
    expect(interaction.commitResize).not.toHaveBeenCalled();
  });

  // ---- create ----
  function CreateHarness() {
    const onCreateStart = useTimelineCreate({ resourceIndex: 0 });
    return <div data-testid="create" onMouseDown={onCreateStart} />;
  }

  it('create：空白横拖 mouseup 提交 commitCreate(资源行, 起, 止)', () => {
    mount(<CreateHarness />);
    down('create', { button: 0, buttons: 1, clientX: 80, clientY: 10 }); // onInit → startDay=1
    moveDoc({ button: 0, buttons: 1, clientX: 320, clientY: 10 });
    upDoc({ button: 0, buttons: 0, clientX: 320, clientY: 10 }); // dayIndex=4

    expect(interaction.commitCreate).toHaveBeenCalledTimes(1);
    expect(interaction.commitCreate).toHaveBeenCalledWith(0, 1, 4);
  });

  it('create：ESC 取消 → 清预览、不提交', () => {
    mount(<CreateHarness />);
    down('create', { button: 0, buttons: 1, clientX: 80, clientY: 10 });
    moveDoc({ button: 0, buttons: 1, clientX: 320, clientY: 10 });
    escDoc();

    expect(interaction.setDragPreview).toHaveBeenCalledWith(null);
    expect(interaction.commitCreate).not.toHaveBeenCalled();

    upDoc({ button: 0, buttons: 0, clientX: 320, clientY: 10 });
    expect(interaction.commitCreate).not.toHaveBeenCalled();
  });
});
