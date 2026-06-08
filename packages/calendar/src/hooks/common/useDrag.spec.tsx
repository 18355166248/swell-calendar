import { act, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
  onPressESCKeyCalls: number;
};

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function DragHarness({
  store,
  onSnapshot,
}: {
  store: ReturnType<typeof createCalendarStore>;
  onSnapshot: (snapshot: DragSnapshot) => void;
}) {
  const countersRef = useRef({
    onDragStartCalls: 0,
    onMouseUpCalls: 0,
    onPressESCKeyCalls: 0,
  });

  function Inner() {
    const handleMouseDown = useDrag('event/timeGrid/move/1', {
      onDragStart: () => {
        countersRef.current.onDragStartCalls += 1;
      },
      onMouseUp: () => {
        countersRef.current.onMouseUpCalls += 1;
      },
      onPressESCKey: () => {
        countersRef.current.onPressESCKeyCalls += 1;
      },
    });
    const draggingState = useCalendarStore((state) => state.dnd.draggingState);

    onSnapshot({
      draggingState,
      onDragStartCalls: countersRef.current.onDragStartCalls,
      onMouseUpCalls: countersRef.current.onMouseUpCalls,
      onPressESCKeyCalls: countersRef.current.onPressESCKeyCalls,
    });

    return <div data-testid="drag-target" onMouseDown={handleMouseDown} />;
  }

  return (
    <CalendarStoreProvider store={store}>
      <Inner />
    </CalendarStoreProvider>
  );
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
      onPressESCKeyCalls: 0,
    };
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
  });

  function mount() {
    act(() => {
      root.render(
        <DragHarness
          store={store}
          onSnapshot={(snapshot) => {
            latest = snapshot;
          }}
        />
      );
    });
  }

  function dispatchToTarget(type: 'mousedown', init: MouseEventInit) {
    const target = container.querySelector('[data-testid="drag-target"]');
    if (!target) {
      throw new Error('drag target not found');
    }

    act(() => {
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }));
    });
  }

  function dispatchToDocument(type: 'mousemove' | 'mouseup', init: MouseEventInit) {
    act(() => {
      document.dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }));
    });
  }

  function dispatchKeyToDocument(key: string) {
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));
    });
  }

  it('auto-recovers when mouseup is lost and allows the next drag to start again', () => {
    mount();

    dispatchToTarget('mousedown', {
      button: 0,
      buttons: 1,
      clientX: 10,
      clientY: 10,
    });
    expect(latest.draggingState).toBe(DraggingState.INIT);

    dispatchToDocument('mousemove', {
      button: 0,
      buttons: 1,
      clientX: 10,
      clientY: 20,
    });
    expect(latest.draggingState).toBe(DraggingState.DRAGGING);
    expect(latest.onDragStartCalls).toBe(1);

    // 模拟 mouseup 丢失：没有 mouseup，只收到 buttons=0 的 mousemove
    dispatchToDocument('mousemove', {
      button: 0,
      buttons: 0,
      clientX: 10,
      clientY: 30,
    });
    expect(latest.draggingState).toBe(DraggingState.IDLE);
    expect(latest.onMouseUpCalls).toBe(1);

    // 若恢复失败，这里第二次拖拽会一直卡住无法重新开始
    dispatchToTarget('mousedown', {
      button: 0,
      buttons: 1,
      clientX: 30,
      clientY: 30,
    });
    dispatchToDocument('mousemove', {
      button: 0,
      buttons: 1,
      clientX: 30,
      clientY: 40,
    });
    expect(latest.draggingState).toBe(DraggingState.DRAGGING);
    expect(latest.onDragStartCalls).toBe(2);

    dispatchToDocument('mouseup', {
      button: 0,
      buttons: 0,
      clientX: 30,
      clientY: 40,
    });
    expect(latest.draggingState).toBe(DraggingState.IDLE);
    expect(latest.onMouseUpCalls).toBe(2);
  });

  it('cancels the in-progress drag on Escape and skips the trailing mouseup commit', () => {
    mount();

    dispatchToTarget('mousedown', { button: 0, buttons: 1, clientX: 10, clientY: 10 });
    dispatchToDocument('mousemove', { button: 0, buttons: 1, clientX: 10, clientY: 30 });
    expect(latest.draggingState).toBe(DraggingState.DRAGGING);

    // ESC：取消拖拽，状态置 CANCELED，onPressESCKey 触发一次
    dispatchKeyToDocument('Escape');
    expect(latest.draggingState).toBe(DraggingState.CANCELED);
    expect(latest.onPressESCKeyCalls).toBe(1);

    // ESC 后监听已移除：后续 mouseup 不应再触发提交
    dispatchToDocument('mouseup', { button: 0, buttons: 0, clientX: 10, clientY: 30 });
    expect(latest.onMouseUpCalls).toBe(0);
    expect(latest.draggingState).toBe(DraggingState.CANCELED);

    // CANCELED 为终态：下一次拖拽仍能正常开始（initDrag 复位）
    dispatchToTarget('mousedown', { button: 0, buttons: 1, clientX: 40, clientY: 40 });
    dispatchToDocument('mousemove', { button: 0, buttons: 1, clientX: 40, clientY: 60 });
    expect(latest.draggingState).toBe(DraggingState.DRAGGING);
    expect(latest.onDragStartCalls).toBe(2);
  });

  it('ignores non-Escape keydown during drag', () => {
    mount();

    dispatchToTarget('mousedown', { button: 0, buttons: 1, clientX: 10, clientY: 10 });
    dispatchToDocument('mousemove', { button: 0, buttons: 1, clientX: 10, clientY: 30 });
    expect(latest.draggingState).toBe(DraggingState.DRAGGING);

    dispatchKeyToDocument('Enter');
    expect(latest.onPressESCKeyCalls).toBe(0);
    expect(latest.draggingState).toBe(DraggingState.DRAGGING);
  });
});
