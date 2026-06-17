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
  });

  function Inner() {
    const handleMouseDown = useDrag('event/timeGrid/move/1', {
      onDragStart: () => {
        countersRef.current.onDragStartCalls += 1;
      },
      onMouseUp: () => {
        countersRef.current.onMouseUpCalls += 1;
      },
    });
    const draggingState = useCalendarStore((state) => state.dnd.draggingState);

    onSnapshot({
      draggingState,
      onDragStartCalls: countersRef.current.onDragStartCalls,
      onMouseUpCalls: countersRef.current.onMouseUpCalls,
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
});
