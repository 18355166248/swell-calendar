import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CalendarStoreProvider, createCalendarStore } from '@/contexts/calendarStore';
import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import { DraggingState } from '@/types/dnd.type';
import { EventResizeDirection } from '@/types/drag.type';

import { useDraggingEvent } from './useDraggingEvent';

type HookSnapshot = {
  draggingEventCid: number | null;
  isDraggingEnd: boolean;
  isDraggingCanceled: boolean;
  resizeDirection: EventResizeDirection;
  clearDraggingEvent: () => void;
};

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function makeEventUIModel(id: string, start: string, end: string) {
  const uiModel = new EventUIModel(
    new EventModel({
      id,
      title: id,
      category: 'time',
      start: new Date(start),
      end: new Date(end),
      resourceId: 'r1',
    })
  );

  uiModel.setUIProps({
    top: 0,
    left: 0,
    width: 100,
    height: 50,
  });

  return uiModel;
}

describe('useDraggingEvent integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let latest: HookSnapshot;
  let store: ReturnType<typeof createCalendarStore>;

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    store = createCalendarStore();
    latest = {
      draggingEventCid: null,
      isDraggingEnd: false,
      isDraggingCanceled: false,
      resizeDirection: 'end',
      clearDraggingEvent: () => {},
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
    function Harness() {
      const hook = useDraggingEvent('timeGrid', 'resize');

      latest = {
        draggingEventCid: hook.draggingEvent?.cid() ?? null,
        isDraggingEnd: hook.isDraggingEnd,
        isDraggingCanceled: hook.isDraggingCanceled,
        resizeDirection: hook.resizeDirection,
        clearDraggingEvent: hook.clearDraggingEvent,
      };

      return null;
    }

    act(() => {
      root.render(
        <CalendarStoreProvider store={store}>
          <Harness />
        </CalendarStoreProvider>
      );
    });
  }

  it('marks drag end even when setDragging and reset happen in the same batch', () => {
    mount();

    const uiModel = makeEventUIModel('event-a', '2026-06-08T09:00:00', '2026-06-08T10:00:00');
    const cid = uiModel.cid();

    act(() => {
      store.getState().dnd.initDrag({
        draggingItemType: `event/timeGrid/resize/start/${cid}`,
        initX: 10,
        initY: 10,
      });
      store.getState().dnd.setDraggingEventUIModel(uiModel);
      store.getState().dnd.setDragging({ x: 12, y: 40 });
      store.getState().dnd.reset();
    });

    expect(latest.draggingEventCid).toBe(cid);
    expect(latest.resizeDirection).toBe('start');
    expect(latest.isDraggingEnd).toBe(true);
    expect(latest.isDraggingCanceled).toBe(false);

    act(() => {
      latest.clearDraggingEvent();
    });
    expect(latest.draggingEventCid).toBeNull();
    expect(latest.resizeDirection).toBe('end');
    expect(latest.isDraggingEnd).toBe(false);
  });

  it('can track a different event after the previous drag cycle is cleared', () => {
    mount();

    const first = makeEventUIModel('event-a', '2026-06-08T09:00:00', '2026-06-08T10:00:00');
    const second = makeEventUIModel('event-b', '2026-06-08T11:00:00', '2026-06-08T12:00:00');

    act(() => {
      store.getState().dnd.initDrag({
        draggingItemType: `event/timeGrid/resize/start/${first.cid()}`,
        initX: 10,
        initY: 10,
      });
      store.getState().dnd.setDraggingEventUIModel(first);
      store.getState().dnd.setDragging({ x: 12, y: 40 });
      store.getState().dnd.reset();
    });

    act(() => {
      latest.clearDraggingEvent();
    });

    act(() => {
      store.getState().dnd.initDrag({
        draggingItemType: `event/timeGrid/resize/end/${second.cid()}`,
        initX: 20,
        initY: 20,
      });
      store.getState().dnd.setDraggingEventUIModel(second);
      store.getState().dnd.setDragging({ x: 30, y: 60 });
    });

    expect(store.getState().dnd.draggingState).toBe(DraggingState.DRAGGING);
    expect(latest.draggingEventCid).toBe(second.cid());
    expect(latest.resizeDirection).toBe('end');
    expect(latest.isDraggingEnd).toBe(false);
  });
});
