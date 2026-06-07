import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CalendarCallbacksProvider } from '@/contexts/calendarCallbacks';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeGridDropPreview } from '@/types/dnd-preview.type';
import { TimeGridData } from '@/types/grid.type';
import { NormalizedOptions } from '@/types/options.type';

import { useExternalDrop } from './useExternalDrop';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

const timeGridData: TimeGridData = {
  columns: [
    {
      date: new DayjsTZDate('2026-06-08T00:00:00'),
      left: 0,
      width: 100,
      resourceId: 'r1',
      resourceName: '会议室 A',
    },
  ],
  rows: [
    {
      top: 0,
      height: 40,
      startTime: '09:00',
      endTime: '09:30',
    },
  ],
};

function createOptions(): NormalizedOptions {
  return {
    defaultView: 'scheduler',
    week: {
      startDayOfWeek: 0,
      narrowWeekend: false,
      workweek: false,
      hourStart: 9,
      hourEnd: 18,
      hourDivision: 2,
      dayNames: [],
      eventView: [],
      taskView: false,
      invalid: [],
      blockedTimes: [],
    },
    month: {
      startDayOfWeek: 0,
      isAlways6Weeks: false,
    },
    scheduler: {
      resources: [{ id: 'r1', name: '会议室 A' }],
      hourStart: 9,
      hourEnd: 18,
      invalid: [],
      blockedTimes: [],
      colors: [],
      dragToCreate: true,
      dragToMove: true,
      dragToResize: true,
      dragInTime: true,
      eventOverlap: true,
      visibleResourceIds: ['r1'],
      dragBetweenResources: true,
      allowExternalDrop: true,
    },
    timeline: {
      resources: [],
      hourStart: 9,
      hourEnd: 18,
      rowHeight: 0,
      cellWidth: 0,
      invalid: [],
      blockedTimes: [],
      colors: [],
      visibleResourceIds: [],
    },
    isReadOnly: false,
    views: {
      day: true,
      week: true,
      month: true,
      scheduler: true,
      timeline: true,
    },
    initialDate: undefined,
    template: {},
  } as unknown as NormalizedOptions;
}

describe('useExternalDrop preview', () => {
  let container: HTMLDivElement;
  let root: Root;
  let latestHandlers: ReturnType<typeof useExternalDrop> | null;
  let previewChanges: Array<TimeGridDropPreview | null>;

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    latestHandlers = null;
    previewChanges = [];
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
  });

  function mount(options = createOptions()) {
    function Harness() {
      latestHandlers = useExternalDrop({
        enabled: true,
        gridPositionFinder: () => ({ columnIndex: 0, rowIndex: 0 }),
        timeGridData,
        options,
        onPreviewChange: (preview) => {
          previewChanges.push(preview);
        },
      });

      return null;
    }

    act(() => {
      root.render(
        <CalendarCallbacksProvider callbacks={{ onExternalDrop: vi.fn() }}>
          <Harness />
        </CalendarCallbacksProvider>
      );
    });
  }

  it('emits allowed preview during dragOver and clears it after drop', () => {
    mount();

    const dataTransfer = {
      getData: vi.fn().mockReturnValue(''),
      setData: vi.fn(),
    } as unknown as DataTransfer;

    act(() => {
      latestHandlers?.handleDragOver({
        preventDefault: vi.fn(),
        clientX: 20,
        clientY: 20,
        dataTransfer,
      } as unknown as React.DragEvent);
    });

    expect(previewChanges.at(-1)).toMatchObject({
      source: 'external',
      status: 'allowed',
      resourceId: 'r1',
      resourceName: '会议室 A',
    });

    act(() => {
      latestHandlers?.handleDrop({
        preventDefault: vi.fn(),
        clientX: 20,
        clientY: 20,
        dataTransfer,
      } as unknown as React.DragEvent);
    });

    expect(previewChanges.at(-1)).toBeNull();
  });
});
