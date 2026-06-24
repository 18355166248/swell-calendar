import { act, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CalendarStoreProvider,
  createCalendarStore,
  useCalendarStore,
} from '@/contexts/calendarStore';
import { DraggingState } from '@/types/dnd.type';

import { useDrag } from './useDrag';

type DragSnapshot = {
  draggingState: DraggingState;
  onDragStartCalls: number;
  onMouseUpCalls: number;
};

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function DragHarness({
  store,
  onSnapshot,
  delayTouchStart,
}: {
  store: ReturnType<typeof createCalendarStore>;
  onSnapshot: (snapshot: DragSnapshot) => void;
  delayTouchStart?: number;
}) {
  const countersRef = useRef({
    onDragStartCalls: 0,
    onMouseUpCalls: 0,
  });

  function Inner() {
    const handlePointerDown = useDrag(
      'event/timeGrid/move/1',
      {
        onDragStart: () => {
          countersRef.current.onDragStartCalls += 1;
        },
        onMouseUp: () => {
          countersRef.current.onMouseUpCalls += 1;
        },
      },
      { delayTouchStart }
    );
    const draggingState = useCalendarStore((state) => state.dnd.draggingState);

    onSnapshot({
      draggingState,
      onDragStartCalls: countersRef.current.onDragStartCalls,
      onMouseUpCalls: countersRef.current.onMouseUpCalls,
    });

    return <div data-testid="drag-target" onPointerDown={handlePointerDown} />;
  }

  return (
    <CalendarStoreProvider store={store}>
      <Inner />
    </CalendarStoreProvider>
  );
}

// jsdom 没有原生 PointerEvent 构造器，用 MouseEvent 承载坐标/按键，再补 pointer 字段。
function makePointerEvent(
  type: string,
  init: MouseEventInit & { pointerId?: number; pointerType?: string }
) {
  const { pointerId = 1, pointerType = 'mouse', ...mouseInit } = init;
  const e = new MouseEvent(type, { bubbles: true, ...mouseInit });
  Object.assign(e, { pointerId, pointerType });
  return e;
}

describe('useDrag', () => {
  let container: HTMLDivElement;
  let root: Root;
  let latest: DragSnapshot;
  let store: ReturnType<typeof createCalendarStore>;

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    store = createCalendarStore();
    latest = {
      draggingState: DraggingState.IDLE,
      onDragStartCalls: 0,
      onMouseUpCalls: 0,
    };
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
  });

  function mount(delayTouchStart?: number) {
    act(() => {
      root.render(
        <DragHarness
          store={store}
          delayTouchStart={delayTouchStart}
          onSnapshot={(snapshot) => {
            latest = snapshot;
          }}
        />
      );
    });
  }

  function dispatchToTarget(
    type: 'pointerdown',
    init: MouseEventInit & { pointerId?: number; pointerType?: string }
  ) {
    const target = container.querySelector('[data-testid="drag-target"]');
    if (!target) {
      throw new Error('drag target not found');
    }

    act(() => {
      target.dispatchEvent(makePointerEvent(type, init));
    });
  }

  function dispatchToDocument(
    type: 'pointermove' | 'pointerup' | 'pointercancel',
    init: MouseEventInit & { pointerId?: number; pointerType?: string }
  ) {
    act(() => {
      document.dispatchEvent(makePointerEvent(type, init));
    });
  }

  it('auto-recovers when pointerup is lost and allows the next drag to start again (mouse)', () => {
    mount();

    dispatchToTarget('pointerdown', {
      button: 0,
      buttons: 1,
      clientX: 10,
      clientY: 10,
    });
    expect(latest.draggingState).toBe(DraggingState.INIT);

    dispatchToDocument('pointermove', {
      button: 0,
      buttons: 1,
      clientX: 10,
      clientY: 20,
    });
    expect(latest.draggingState).toBe(DraggingState.DRAGGING);
    expect(latest.onDragStartCalls).toBe(1);

    // 模拟 pointerup 丢失：没有 pointerup，只收到 buttons=0 的 pointermove
    dispatchToDocument('pointermove', {
      button: 0,
      buttons: 0,
      clientX: 10,
      clientY: 30,
    });
    expect(latest.draggingState).toBe(DraggingState.IDLE);
    expect(latest.onMouseUpCalls).toBe(1);

    // 若恢复失败，这里第二次拖拽会一直卡住无法重新开始
    dispatchToTarget('pointerdown', {
      button: 0,
      buttons: 1,
      clientX: 30,
      clientY: 30,
    });
    dispatchToDocument('pointermove', {
      button: 0,
      buttons: 1,
      clientX: 30,
      clientY: 40,
    });
    expect(latest.draggingState).toBe(DraggingState.DRAGGING);
    expect(latest.onDragStartCalls).toBe(2);

    dispatchToDocument('pointerup', {
      button: 0,
      buttons: 0,
      clientX: 30,
      clientY: 40,
    });
    expect(latest.draggingState).toBe(DraggingState.IDLE);
    expect(latest.onMouseUpCalls).toBe(1 + 1);
  });

  it('starts a touch drag immediately when no long-press delay is configured', () => {
    mount();

    dispatchToTarget('pointerdown', {
      button: 0,
      buttons: 1,
      clientX: 10,
      clientY: 10,
      pointerType: 'touch',
    });
    // 触控无长按配置（事件卡片 move/resize 场景）：按下即进入拖拽
    expect(latest.draggingState).toBe(DraggingState.INIT);

    dispatchToDocument('pointermove', {
      buttons: 1,
      clientX: 10,
      clientY: 24,
      pointerType: 'touch',
    });
    expect(latest.draggingState).toBe(DraggingState.DRAGGING);
    expect(latest.onDragStartCalls).toBe(1);

    dispatchToDocument('pointerup', {
      buttons: 0,
      clientX: 10,
      clientY: 24,
      pointerType: 'touch',
    });
    expect(latest.draggingState).toBe(DraggingState.IDLE);
    expect(latest.onMouseUpCalls).toBe(1);
  });

  it('does NOT start a touch drag before the long-press delay elapses', () => {
    vi.useFakeTimers();
    try {
      mount(400);

      dispatchToTarget('pointerdown', {
        button: 0,
        buttons: 1,
        clientX: 10,
        clientY: 10,
        pointerType: 'touch',
      });
      // 长按未到时，处于等待态：尚未进入拖拽
      expect(latest.draggingState).toBe(DraggingState.IDLE);

      // 未到时长就抬起（轻点）：不创建、不进入拖拽
      dispatchToDocument('pointerup', {
        buttons: 0,
        clientX: 10,
        clientY: 10,
        pointerType: 'touch',
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(latest.draggingState).toBe(DraggingState.IDLE);
      expect(latest.onDragStartCalls).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels long-press when the finger moves beyond tolerance (treated as scroll)', () => {
    vi.useFakeTimers();
    try {
      mount(400);

      dispatchToTarget('pointerdown', {
        button: 0,
        buttons: 1,
        clientX: 10,
        clientY: 10,
        pointerType: 'touch',
      });

      // 长按到达前手指明显移动 → 判定为滚动，放弃长按创建
      dispatchToDocument('pointermove', {
        buttons: 1,
        clientX: 10,
        clientY: 60,
        pointerType: 'touch',
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(latest.draggingState).toBe(DraggingState.IDLE);
      expect(latest.onDragStartCalls).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('activates a touch drag after the long-press delay, then drags', () => {
    vi.useFakeTimers();
    try {
      mount(400);

      dispatchToTarget('pointerdown', {
        button: 0,
        buttons: 1,
        clientX: 10,
        clientY: 10,
        pointerType: 'touch',
      });
      expect(latest.draggingState).toBe(DraggingState.IDLE);

      // 长按到达：进入拖拽初始态（onInit → INIT）
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(latest.draggingState).toBe(DraggingState.INIT);

      // 激活后移动 → 进入 DRAGGING
      dispatchToDocument('pointermove', {
        buttons: 1,
        clientX: 12,
        clientY: 40,
        pointerType: 'touch',
      });
      expect(latest.draggingState).toBe(DraggingState.DRAGGING);
      expect(latest.onDragStartCalls).toBe(1);

      dispatchToDocument('pointerup', {
        buttons: 0,
        clientX: 12,
        clientY: 40,
        pointerType: 'touch',
      });
      expect(latest.draggingState).toBe(DraggingState.IDLE);
      expect(latest.onMouseUpCalls).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
