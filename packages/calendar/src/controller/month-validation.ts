import {
  CalendarCallbacks,
  CalendarEventChangeAction,
  CalendarEventChangeFailedInfo,
  CalendarPolicySource,
} from '@/types/callbacks.type';
import { EventObject, EventObjectWithDefaultValues } from '@/types/events.type';
import { Options } from '@/types/options.type';

/**
 * 月视图（日粒度）拖拽交互校验。
 *
 * 务实子集：per-event editable/draggable/resizable + month 级
 * dragToCreate/dragToMove/dragToResize 开关 + onValidateEventChange + 失败回调。
 * 不含 overlap / invalid 区间（与 timeline 首版一致，见任务文档）。
 *
 * 刻意与 `timeline-validation.ts` / `scheduler-validation.ts` 解耦，避免改动既有校验链。
 */

function dispatchFailed(
  callbacks: CalendarCallbacks | null | undefined,
  info: CalendarEventChangeFailedInfo
) {
  if (info.action === 'create') {
    callbacks?.onEventCreateFailed?.(info);
    return;
  }
  callbacks?.onEventUpdateFailed?.(info);
}

/** month 级开关（dragToCreate/Move/Resize === false）命中则返回 'view'。 */
function getDisabledViewPolicySource(
  options: Options,
  action: CalendarEventChangeAction
): CalendarPolicySource | null {
  const month = options.month;
  if (!month) {
    return null;
  }

  if (action === 'create' && month.dragToCreate === false) {
    return 'view';
  }
  if (action === 'move' && month.dragToMove === false) {
    return 'view';
  }
  if (action === 'resize' && month.dragToResize === false) {
    return 'view';
  }
  return null;
}

/** per-event editable/draggable/resizable === false 命中则返回 'event'。 */
function getDisabledEventPolicySource(
  action: CalendarEventChangeAction,
  event: EventObject,
  previousEvent?: EventObjectWithDefaultValues
): CalendarPolicySource | null {
  const policyEvent = previousEvent ?? event;

  if ((action === 'move' || action === 'resize') && policyEvent.editable === false) {
    return 'event';
  }
  if (action === 'move' && policyEvent.draggable === false) {
    return 'event';
  }
  if (action === 'resize' && policyEvent.resizable === false) {
    return 'event';
  }
  return null;
}

export function shouldAcceptMonthEventChange(
  options: Options,
  callbacks: CalendarCallbacks | null | undefined,
  {
    action,
    event,
    previousEvent,
  }: {
    action: CalendarEventChangeAction;
    event: EventObject;
    previousEvent?: EventObjectWithDefaultValues;
  }
): boolean {
  const viewPolicySource = getDisabledViewPolicySource(options, action);
  if (viewPolicySource) {
    dispatchFailed(callbacks, {
      reason: 'policy',
      policySource: viewPolicySource,
      action,
      event,
      previousEvent,
    });
    return false;
  }

  const eventPolicySource = getDisabledEventPolicySource(action, event, previousEvent);
  if (eventPolicySource) {
    dispatchFailed(callbacks, {
      reason: 'policy',
      policySource: eventPolicySource,
      action,
      event,
      previousEvent,
    });
    return false;
  }

  return (
    callbacks?.onValidateEventChange?.({
      action,
      view: 'month',
      event,
      previousEvent,
    }) ?? true
  );
}
