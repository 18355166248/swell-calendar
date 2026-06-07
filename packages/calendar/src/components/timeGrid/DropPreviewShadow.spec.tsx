import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeGridDropPreview } from '@/types/dnd-preview.type';
import { TimeGridData } from '@/types/grid.type';

import DropPreviewShadow from './DropPreviewShadow';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

const timeGridData: TimeGridData = {
  columns: [
    {
      date: new DayjsTZDate('2026-06-08T00:00:00'),
      left: 14.285714,
      width: 14.285714,
      resourceId: 'r1',
      resourceName: '会议室 A',
    },
  ],
  rows: [
    {
      top: 12.5,
      height: 6.25,
      startTime: '09:00',
      endTime: '09:30',
    },
  ],
};

const preview: TimeGridDropPreview = {
  source: 'external',
  status: 'allowed',
  position: { columnIndex: 0, rowIndex: 0 },
  start: new DayjsTZDate('2026-06-08T09:00:00'),
  end: new DayjsTZDate('2026-06-08T09:30:00'),
  resourceId: 'r1',
  resourceName: '会议室 A',
};

describe('DropPreviewShadow', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
  });

  it('renders scheduler grid coordinates using percentage styles', () => {
    act(() => {
      root.render(<DropPreviewShadow preview={preview} timeGridData={timeGridData} />);
    });

    const shadow = container.querySelector('[data-testid="timegrid-drop-preview"]') as HTMLElement;

    expect(shadow).not.toBeNull();
    expect(shadow.style.top).toBe('12.5%');
    expect(shadow.style.left).toBe('14.285714%');
    expect(shadow.style.width).toBe('14.285714%');
    expect(shadow.style.height).toBe('6.25%');
  });
});
