import { findResource } from '@/controller/scheduler-resources';
import {
  CalendarCallbacks,
  CalendarEventChangeAction,
  CalendarEventChangeFailedInfo,
  CalendarPolicySource,
} from '@/types/callbacks.type';
import { EventObject, EventObjectWithDefaultValues } from '@/types/events.type';
import { CommonGridColumn } from '@/types/grid.type';
import { Options, ViewType } from '@/types/options.type';

import { getResourceIds, getTimeValue, isBlockedEventChange } from './scheduler.controller';

const MINUTE_MS = 60_000;

function hasTimeValue(event: EventObject) {
  return Boolean(event.start && event.end);
}

function isSameEvent(event: EventObject, previousEvent?: EventObjectWithDefaultValues) {
  if (!previousEvent) {
    return false;
  }

  const eventCid = (event as EventObjectWithDefaultValues).__cid;

  if (eventCid && eventCid === previousEvent.__cid) {
    return true;
  }

  return Boolean(event.id && event.id === previousEvent.id);
}

function isSameResourceScope(event: EventObject, targetEvent: EventObject) {
  const resourceIds = getResourceIds(event);
  const targetResourceIds = getResourceIds(targetEvent);

  if (resourceIds.length === 0 || targetResourceIds.length === 0) {
    return true;
  }

  return resourceIds.some((resourceId) => targetResourceIds.includes(resourceId));
}

function overlapsTime(event: EventObject, targetEvent: EventObject) {
  if (!hasTimeValue(event) || !hasTimeValue(targetEvent)) {
    return false;
  }

  const eventStart = getTimeValue(event.start) - (event.bufferBefore ?? 0) * MINUTE_MS;
  const eventEnd = getTimeValue(event.end) + (event.bufferAfter ?? 0) * MINUTE_MS;
  const targetStart = getTimeValue(targetEvent.start) - (targetEvent.bufferBefore ?? 0) * MINUTE_MS;
  const targetEnd = getTimeValue(targetEvent.end) + (targetEvent.bufferAfter ?? 0) * MINUTE_MS;

  return eventStart < targetEnd && eventEnd > targetStart;
}

function hasTimeChanged(event: EventObject, previousEvent?: EventObjectWithDefaultValues) {
  if (!previousEvent) {
    return false;
  }

  return (
    getTimeValue(event.start) !== getTimeValue(previousEvent.start) ||
    getTimeValue(event.end) !== getTimeValue(previousEvent.end)
  );
}

function getDisabledSchedulerInteractionPolicySource(
  options: Options,
  action: CalendarEventChangeAction,
  event: EventObject,
  previousEvent?: EventObjectWithDefaultValues
): CalendarPolicySource | null {
  const schedulerOptions = options.scheduler;

  if (!schedulerOptions) {
    return null;
  }

  if (action === 'create' && schedulerOptions.dragToCreate === false) {
    return 'view';
  }

  if (action === 'move' && schedulerOptions.dragToMove === false) {
    return 'view';
  }

  if (action === 'resize' && schedulerOptions.dragToResize === false) {
    return 'view';
  }

  if (
    schedulerOptions.dragInTime === false &&
    (action === 'move' || action === 'resize') &&
    hasTimeChanged(event, previousEvent)
  ) {
    return 'view';
  }

  return null;
}

function getDisabledSchedulerEventPolicySource(
  action: CalendarEventChangeAction,
  event: EventObject,
  previousEvent?: EventObjectWithDefaultValues
): CalendarPolicySource | null {
  const policyEvent = previousEvent ?? event;

  if (
    (action === 'move' || action === 'resize' || action === 'delete') &&
    policyEvent.editable === false
  ) {
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

function getDisabledSchedulerResourcePolicySource(
  options: Options,
  action: CalendarEventChangeAction,
  event: EventObject,
  previousEvent?: EventObjectWithDefaultValues
): CalendarPolicySource | null {
  const resources = options.scheduler?.resources;
  if (!resources || resources.length === 0) {
    return null;
  }

  const resourceId = event.resourceId ?? event.resourceIds?.[0];
  if (!resourceId) {
    return null;
  }

  const resource = findResource(resources, resourceId);
  if (!resource) {
    return null;
  }

  if (
    resource.eventDragInTime === false &&
    (action === 'move' || action === 'resize') &&
    hasTimeChanged(event, previousEvent)
  ) {
    return 'resource';
  }

  if (action === 'resize' && resource.eventResize === false) {
    return 'resource';
  }

  return null;
}

function isCrossResourceMove(
  event: EventObject,
  previousEvent?: EventObjectWithDefaultValues,
  targetColumn?: CommonGridColumn
): boolean {
  if (!targetColumn?.resourceId || !previousEvent) {
    return false;
  }

  const prevResourceId = previousEvent.resourceId;
  const prevResourceIds = previousEvent.resourceIds ?? (prevResourceId ? [prevResourceId] : []);

  return !prevResourceIds.includes(targetColumn.resourceId);
}

function getDisabledDragBetweenResourcesPolicySource(
  options: Options,
  event: EventObject,
  previousEvent?: EventObjectWithDefaultValues,
  targetColumn?: CommonGridColumn
): CalendarPolicySource | null {
  if (!isCrossResourceMove(event, previousEvent, targetColumn)) {
    return null;
  }

  const policyEvent = previousEvent ?? event;

  if (policyEvent.dragBetweenResources === true) {
    return null;
  }

  if (policyEvent.dragBetweenResources === false) {
    return 'event';
  }

  const resourceId = policyEvent.resourceId ?? policyEvent.resourceIds?.[0];
  if (resourceId && options.scheduler?.resources) {
    const resource = findResource(options.scheduler.resources, resourceId);

    if (resource?.eventDragBetweenResources === true) {
      return null;
    }

    if (resource?.eventDragBetweenResources === false) {
      return 'resource';
    }
  }

  if (options.scheduler?.dragBetweenResources === true) {
    return null;
  }

  if (options.scheduler?.dragBetweenResources === false) {
    return 'view';
  }

  return null;
}

function dispatchEventChangeFailed(
  callbacks: CalendarCallbacks | null | undefined,
  info: CalendarEventChangeFailedInfo
) {
  if (info.action === 'create') {
    callbacks?.onEventCreateFailed?.(info);
    return;
  }

  callbacks?.onEventUpdateFailed?.(info);
}

function getResourceEventOverlap(options: Options, event: EventObject): boolean | undefined {
  const resourceId = event.resourceId ?? event.resourceIds?.[0];
  if (!resourceId || !options.scheduler?.resources) {
    return undefined;
  }

  const resource = findResource(options.scheduler.resources, resourceId);
  return resource?.eventOverlap;
}

function isPairOverlapDenied(options: Options, event: EventObject, existingEvent: EventObject) {
  if (event.overlap === false || existingEvent.overlap === false) {
    return true;
  }

  if (event.overlap === true || existingEvent.overlap === true) {
    return false;
  }

  const resourceOverlap = getResourceEventOverlap(options, event);
  const existingResourceOverlap = getResourceEventOverlap(options, existingEvent);

  if (resourceOverlap === false || existingResourceOverlap === false) {
    return true;
  }

  if (resourceOverlap === true || existingResourceOverlap === true) {
    return false;
  }

  return options.scheduler?.eventOverlap === false;
}

function isOverlappingSchedulerEventChange(
  options: Options,
  event: EventObject,
  existingEvents: EventObject[] = [],
  previousEvent?: EventObjectWithDefaultValues
) {
  return existingEvents.some((existingEvent) => {
    return (
      !isSameEvent(existingEvent, previousEvent) &&
      isSameResourceScope(event, existingEvent) &&
      overlapsTime(event, existingEvent) &&
      isPairOverlapDenied(options, event, existingEvent)
    );
  });
}

export function shouldAcceptEventChange(
  options: Options,
  callbacks: CalendarCallbacks | null | undefined,
  {
    action,
    view,
    event,
    previousEvent,
    existingEvents,
    targetColumn,
  }: {
    action: CalendarEventChangeAction;
    view: ViewType;
    event: EventObject;
    previousEvent?: EventObjectWithDefaultValues;
    existingEvents?: EventObject[];
    targetColumn?: CommonGridColumn;
  }
) {
  if (view === 'scheduler') {
    const viewPolicySource = getDisabledSchedulerInteractionPolicySource(
      options,
      action,
      event,
      previousEvent
    );

    if (viewPolicySource) {
      dispatchEventChangeFailed(callbacks, {
        reason: 'policy',
        policySource: viewPolicySource,
        action,
        event,
        previousEvent,
      });
      return false;
    }

    const eventPolicySource = getDisabledSchedulerEventPolicySource(action, event, previousEvent);

    if (eventPolicySource) {
      dispatchEventChangeFailed(callbacks, {
        reason: 'policy',
        policySource: eventPolicySource,
        action,
        event,
        previousEvent,
      });
      return false;
    }

    const resourcePolicySource = getDisabledSchedulerResourcePolicySource(
      options,
      action,
      event,
      previousEvent
    );

    if (resourcePolicySource) {
      dispatchEventChangeFailed(callbacks, {
        reason: 'policy',
        policySource: resourcePolicySource,
        action,
        event,
        previousEvent,
      });
      return false;
    }

    if (action === 'move') {
      const dragBetweenPolicySource = getDisabledDragBetweenResourcesPolicySource(
        options,
        event,
        previousEvent,
        targetColumn
      );

      if (dragBetweenPolicySource) {
        dispatchEventChangeFailed(callbacks, {
          reason: 'policy',
          policySource: dragBetweenPolicySource,
          action,
          event,
          previousEvent,
        });
        return false;
      }
    }
  }

  if (
    view === 'scheduler' &&
    isOverlappingSchedulerEventChange(options, event, existingEvents, previousEvent)
  ) {
    dispatchEventChangeFailed(callbacks, {
      reason: 'overlap',
      action,
      event,
      previousEvent,
    });
    return false;
  }

  if (isBlockedEventChange(options, view, event)) {
    if (view === 'scheduler') {
      dispatchEventChangeFailed(callbacks, {
        reason: 'invalid',
        action,
        event,
        previousEvent,
      });
    }

    return false;
  }

  return (
    callbacks?.onValidateEventChange?.({
      action,
      view,
      event,
      previousEvent,
    }) ?? true
  );
}
