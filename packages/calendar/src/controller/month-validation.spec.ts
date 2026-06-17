import { describe, expect, it, vi } from 'vitest';

import { EventObject } from '@/types/events.type';
import { Options } from '@/types/options.type';

import { shouldAcceptMonthEventChange } from './month-validation';

const event = { id: '1', title: 'e' } as EventObject;

describe('shouldAcceptMonthEventChange', () => {
  it('默认无任何限制时接受', () => {
    const accepted = shouldAcceptMonthEventChange({} as Options, null, {
      action: 'move',
      event,
    });
    expect(accepted).toBe(true);
  });

  it('month.dragToMove === false 时拒绝并触发 onEventUpdateFailed', () => {
    const onEventUpdateFailed = vi.fn();
    const accepted = shouldAcceptMonthEventChange(
      { month: { dragToMove: false } } as Options,
      { onEventUpdateFailed },
      { action: 'move', event }
    );
    expect(accepted).toBe(false);
    expect(onEventUpdateFailed).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'policy', policySource: 'view', action: 'move' })
    );
  });

  it('per-event draggable === false 时拒绝（move）', () => {
    const accepted = shouldAcceptMonthEventChange({} as Options, null, {
      action: 'move',
      event,
      previousEvent: { ...event, draggable: false } as never,
    });
    expect(accepted).toBe(false);
  });

  it('onValidateEventChange 返回 false 时拒绝', () => {
    const accepted = shouldAcceptMonthEventChange(
      {} as Options,
      { onValidateEventChange: () => false },
      { action: 'move', event }
    );
    expect(accepted).toBe(false);
  });
});
