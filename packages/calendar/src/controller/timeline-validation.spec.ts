import { describe, expect, it, vi } from 'vitest';

import { CalendarCallbacks } from '@/types/callbacks.type';
import { EventObject } from '@/types/events.type';
import { Options } from '@/types/options.type';

import { shouldAcceptTimelineEventChange } from './timeline-validation';

const baseEvent = { id: 'e1', start: new Date(), end: new Date() } as EventObject;

function optionsWith(timeline: Record<string, unknown> = {}): Options {
  return { timeline } as unknown as Options;
}

describe('shouldAcceptTimelineEventChange', () => {
  it('timeline 级 dragToMove=false 拒绝并触发 onEventUpdateFailed', () => {
    const onEventUpdateFailed = vi.fn();
    const accepted = shouldAcceptTimelineEventChange(
      optionsWith({ dragToMove: false }),
      { onEventUpdateFailed },
      { action: 'move', event: baseEvent, previousEvent: baseEvent as never }
    );
    expect(accepted).toBe(false);
    expect(onEventUpdateFailed).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'policy', policySource: 'view', action: 'move' })
    );
  });

  it('timeline 级 dragToCreate=false 拒绝并触发 onEventCreateFailed', () => {
    const onEventCreateFailed = vi.fn();
    const accepted = shouldAcceptTimelineEventChange(
      optionsWith({ dragToCreate: false }),
      { onEventCreateFailed },
      { action: 'create', event: baseEvent }
    );
    expect(accepted).toBe(false);
    expect(onEventCreateFailed).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'policy', policySource: 'view', action: 'create' })
    );
  });

  it('per-event resizable=false 拒绝 resize（policySource=event）', () => {
    const onEventUpdateFailed = vi.fn();
    const event = { ...baseEvent, resizable: false } as EventObject;
    const accepted = shouldAcceptTimelineEventChange(
      optionsWith(),
      { onEventUpdateFailed },
      { action: 'resize', event, previousEvent: event as never }
    );
    expect(accepted).toBe(false);
    expect(onEventUpdateFailed).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'policy', policySource: 'event', action: 'resize' })
    );
  });

  it('per-event draggable=false 拒绝 move', () => {
    const event = { ...baseEvent, draggable: false } as EventObject;
    const accepted = shouldAcceptTimelineEventChange(
      optionsWith(),
      {},
      {
        action: 'move',
        event,
        previousEvent: event as never,
      }
    );
    expect(accepted).toBe(false);
  });

  it('onValidateEventChange 透传：返回 false 则拒绝', () => {
    const onValidateEventChange = vi.fn().mockReturnValue(false);
    const accepted = shouldAcceptTimelineEventChange(
      optionsWith(),
      { onValidateEventChange } as CalendarCallbacks,
      { action: 'move', event: baseEvent, previousEvent: baseEvent as never }
    );
    expect(accepted).toBe(false);
    expect(onValidateEventChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'move', view: 'timeline' })
    );
  });

  it('默认允许（无开关、无 per-event 限制、无 validate）', () => {
    const accepted = shouldAcceptTimelineEventChange(
      optionsWith(),
      {},
      {
        action: 'move',
        event: baseEvent,
        previousEvent: baseEvent as never,
      }
    );
    expect(accepted).toBe(true);
  });
});
