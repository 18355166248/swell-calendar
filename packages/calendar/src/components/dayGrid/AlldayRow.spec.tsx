import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';

import { AlldayRow } from './AlldayRow';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function makeAlldayUIModel() {
  const model = new EventModel({
    id: 'allday-1',
    title: 'All day',
    category: 'allday',
    allDay: true,
    start: new Date('2026-06-14T00:00:00'),
    end: new Date('2026-06-15T23:59:59'),
  });
  const uiModel = new EventUIModel(model);
  uiModel.width = 28.5;

  return uiModel;
}

describe('AlldayRow', () => {
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

  it('uses the left gutter as an absolute inset instead of widening the event layer', () => {
    act(() => {
      root.render(<AlldayRow uiModels={[makeAlldayUIModel()]} marginLeft="56px" />);
    });

    const contentLayer = container.querySelector(
      '.swell-calendar-allday-row-content'
    ) as HTMLDivElement | null;
    const eventsLayer = container.querySelector(
      '.swell-calendar-allday-row-events'
    ) as HTMLDivElement | null;
    const labelLayer = container.querySelector(
      '.swell-calendar-allday-row-label'
    ) as HTMLDivElement | null;

    expect(contentLayer).not.toBeNull();
    expect(eventsLayer).not.toBeNull();
    expect(labelLayer).not.toBeNull();
    expect(labelLayer?.style.width).toBe('56px');
    expect(contentLayer?.style.marginRight).toBe('0px');
    expect(eventsLayer?.style.left).toBe('');
    expect(eventsLayer?.style.marginLeft).toBe('');
  });

  it('reserves a right inset for the time-grid scrollbar so the all-day lane stays aligned', () => {
    act(() => {
      root.render(
        <AlldayRow uiModels={[makeAlldayUIModel()]} marginLeft="56px" rightInset="14px" />
      );
    });

    const contentLayer = container.querySelector(
      '.swell-calendar-allday-row-content'
    ) as HTMLDivElement | null;
    const eventsLayer = container.querySelector(
      '.swell-calendar-allday-row-events'
    ) as HTMLDivElement | null;

    expect(contentLayer).not.toBeNull();
    expect(eventsLayer).not.toBeNull();
    expect(contentLayer?.style.marginRight).toBe('14px');
    expect(eventsLayer?.style.right).toBe('');
  });
});
