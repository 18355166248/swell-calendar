import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CalendarCallbacksProvider } from '@/contexts/calendarCallbacks';
import { CalendarStoreProvider, createCalendarStore } from '@/contexts/calendarStore';
import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeGridDropPreview } from '@/types/dnd-preview.type';
import { TimeGridData } from '@/types/grid.type';

import { useCrossInstanceDnD } from './useCrossInstanceDnD';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

const timeGridData: TimeGridData = {
  columns: [
    {
      date: new DayjsTZDate('2026-06-08T00:00:00'),
      left: 0,
      width: 100,
      resourceId: 'r2',
      resourceName: '设计组',
    },
  ],
  rows: [
    {
      top: 0,
      height: 40,
      startTime: '14:00',
      endTime: '14:30',
    },
  ],
};

function makeEventUIModel() {
  const uiModel = new EventUIModel(
    new EventModel({
      id: 'cross-preview',
      title: '跨实例预览事件',
      category: 'time',
      start: new Date('2026-06-08T09:00:00'),
      end: new Date('2026-06-08T10:00:00'),
      resourceId: 'r1',
    })
  );

  uiModel.setUIProps({
    top: 0,
    left: 0,
    width: 100,
    height: 60,
  });

  return uiModel;
}

describe('useCrossInstanceDnD preview', () => {
  let mountNode: HTMLDivElement;
  let root: Root;
  let sourceStore: ReturnType<typeof createCalendarStore>;
  let previewChanges: Array<TimeGridDropPreview | null>;
  let sourceContainer: HTMLDivElement;
  let targetContainer: HTMLDivElement;
  let originalElementsFromPoint: typeof document.elementsFromPoint | undefined;

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    mountNode = document.createElement('div');
    document.body.appendChild(mountNode);
    root = createRoot(mountNode);
    sourceStore = createCalendarStore();
    previewChanges = [];
    sourceContainer = document.createElement('div');
    targetContainer = document.createElement('div');
    originalElementsFromPoint = document.elementsFromPoint;
    document.elementsFromPoint = vi.fn(() => [targetContainer]);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    if (originalElementsFromPoint) {
      document.elementsFromPoint = originalElementsFromPoint;
    } else {
      Reflect.deleteProperty(
        document as Document & { elementsFromPoint?: typeof document.elementsFromPoint },
        'elementsFromPoint'
      );
    }
    mountNode.remove();
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
  });

  function mount() {
    function SourceHarness() {
      useCrossInstanceDnD({
        enabled: true,
        containerEl: sourceContainer,
        gridPositionFinder: () => ({ columnIndex: 0, rowIndex: 0 }),
        timeGridData,
      });

      return null;
    }

    function TargetHarness() {
      useCrossInstanceDnD({
        enabled: true,
        containerEl: targetContainer,
        gridPositionFinder: () => ({ columnIndex: 0, rowIndex: 0 }),
        timeGridData,
        onPreviewChange: (preview) => {
          previewChanges.push(preview);
        },
      });

      return null;
    }

    act(() => {
      root.render(
        <>
          <CalendarCallbacksProvider callbacks={{}}>
            <CalendarStoreProvider store={sourceStore}>
              <SourceHarness />
            </CalendarStoreProvider>
          </CalendarCallbacksProvider>
          <CalendarCallbacksProvider callbacks={{}}>
            <CalendarStoreProvider store={createCalendarStore()}>
              <TargetHarness />
            </CalendarStoreProvider>
          </CalendarCallbacksProvider>
        </>
      );
    });
  }

  it('publishes cross-instance preview while dragging and clears it after reset', () => {
    mount();

    const uiModel = makeEventUIModel();

    act(() => {
      sourceStore.getState().dnd.initDrag({
        draggingItemType: `event/timeGrid/move/${uiModel.cid()}`,
        initX: 10,
        initY: 10,
      });
      sourceStore.getState().dnd.setDraggingEventUIModel(uiModel);
      sourceStore.getState().dnd.setDragging({
        x: 220,
        y: 180,
      });
    });

    expect(previewChanges.at(-1)).toMatchObject({
      source: 'cross-instance',
      status: 'allowed',
      resourceId: 'r2',
      resourceName: '设计组',
    });

    act(() => {
      sourceStore.getState().dnd.reset();
    });

    expect(previewChanges.at(-1)).toBeNull();
  });

  it('ignores resize drags — no cross-instance preview is published', () => {
    mount();

    const uiModel = makeEventUIModel();

    act(() => {
      // resize 拖拽（改时长），不应被跨实例桥接管
      sourceStore.getState().dnd.initDrag({
        draggingItemType: `event/timeGrid/resize/end/${uiModel.cid()}`,
        initX: 10,
        initY: 10,
      });
      sourceStore.getState().dnd.setDraggingEventUIModel(uiModel);
      sourceStore.getState().dnd.setDragging({
        x: 220,
        y: 180,
      });
    });

    // 整个 resize 过程不应产生任何跨实例预览
    expect(previewChanges).toHaveLength(0);

    act(() => {
      sourceStore.getState().dnd.reset();
    });

    // resize 结束也不应触发跨实例落点（previewChanges 仍为空）
    expect(previewChanges).toHaveLength(0);
  });
});
