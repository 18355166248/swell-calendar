import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';

import { AlldayEvent } from './AlldayEvent';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function makeAlldayUIModel() {
  const model = new EventModel({
    id: 'allday-event-1',
    title: 'All day',
    category: 'allday',
    allDay: true,
    start: new Date('2026-06-14T00:00:00'),
    end: new Date('2026-06-15T23:59:59'),
  });
  const uiModel = new EventUIModel(model);
  uiModel.left = 0;
  uiModel.width = 28.5;

  return uiModel;
}

describe('AlldayEvent', () => {
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

  it('keeps a small left inset so the first all-day card does not bleed into the gutter boundary', () => {
    act(() => {
      root.render(<AlldayEvent uiModel={makeAlldayUIModel()} height={24} />);
    });

    const card = container.querySelector('.swell-calendar-allday-event') as HTMLDivElement | null;

    expect(card).not.toBeNull();
    expect(card?.style.left).toBe('calc(0% + 1px)');
    expect(card?.style.width).toBe('calc(28.5% - 5px)');
  });
});
