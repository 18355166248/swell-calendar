import { describe, expect, it } from 'vitest';

import { DRAGGING_TYPE_CREATE } from '@/helpers/drag';

import { matchEventDraggingType } from './useDraggingEvent';

describe('matchEventDraggingType', () => {
  it('matches a move type and defaults resize direction to end', () => {
    expect(matchEventDraggingType('event/timeGrid/move/12', 'timeGrid', 'move')).toEqual({
      id: '12',
      direction: 'end',
    });
  });

  it('matches a directionless resize type as end (向后兼容)', () => {
    expect(matchEventDraggingType('event/timeGrid/resize/12', 'timeGrid', 'resize')).toEqual({
      id: '12',
      direction: 'end',
    });
  });

  it('parses the start direction from a top-edge resize type', () => {
    expect(matchEventDraggingType('event/timeGrid/resize/start/12', 'timeGrid', 'resize')).toEqual({
      id: '12',
      direction: 'start',
    });
  });

  it('parses the end direction from a bottom-edge resize type', () => {
    expect(matchEventDraggingType('event/timeGrid/resize/end/12', 'timeGrid', 'resize')).toEqual({
      id: '12',
      direction: 'end',
    });
  });

  it('does not match across areas or behaviors', () => {
    expect(matchEventDraggingType('event/dayGrid/resize/12', 'timeGrid', 'resize')).toBeNull();
    expect(matchEventDraggingType('event/timeGrid/move/12', 'timeGrid', 'resize')).toBeNull();
    expect(matchEventDraggingType('event/timeGrid/resize/start/12', 'timeGrid', 'move')).toBeNull();
    expect(matchEventDraggingType(null, 'timeGrid', 'resize')).toBeNull();
  });

  it('round-trips with DRAGGING_TYPE_CREATE.resizeEvent', () => {
    const topType = DRAGGING_TYPE_CREATE.resizeEvent('timeGrid', '7', 'start');
    const bottomType = DRAGGING_TYPE_CREATE.resizeEvent('timeGrid', '7', 'end');
    const legacyType = DRAGGING_TYPE_CREATE.resizeEvent('timeGrid', '7');

    expect(matchEventDraggingType(topType, 'timeGrid', 'resize')).toEqual({
      id: '7',
      direction: 'start',
    });
    expect(matchEventDraggingType(bottomType, 'timeGrid', 'resize')).toEqual({
      id: '7',
      direction: 'end',
    });
    expect(matchEventDraggingType(legacyType, 'timeGrid', 'resize')).toEqual({
      id: '7',
      direction: 'end',
    });
  });
});
