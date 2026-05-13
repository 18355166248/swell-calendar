import { uniq } from 'lodash-es';

import { setTimeStrToDate } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import {
  CalendarCallbacks,
  CalendarEventChangeAction,
  CalendarEventChangeFailedInfo,
  CalendarPolicySource,
} from '@/types/callbacks.type';
import { EventObject, EventObjectWithDefaultValues } from '@/types/events.type';
import { CommonGridColumn, TimeGridData } from '@/types/grid.type';
import { GridSelectionData } from '@/types/gridSelection.type';
import { BlockedTimeRange, Options, ViewType } from '@/types/options.type';

function getTimeValue(value: EventObject['start']) {
  if (!value) {
    return 0;
  }

  if (typeof value === 'number' || typeof value === 'string' || value instanceof Date) {
    return new Date(value).getTime();
  }

  return value.getTime();
}

function getBlockedTimesByView(options: Options, view: ViewType): BlockedTimeRange[] {
  if (view === 'scheduler') {
    return options.scheduler?.invalid ?? options.scheduler?.blockedTimes ?? [];
  }

  if (view === 'timeline') {
    return options.timeline?.invalid ?? options.timeline?.blockedTimes ?? [];
  }

  if (view === 'week' || view === 'day') {
    return options.week?.invalid ?? options.week?.blockedTimes ?? [];
  }

  return [];
}

function isBlockedForResource(blockedTime: BlockedTimeRange, event: EventObject) {
  const blockedResourceIds = [blockedTime.resourceId, ...(blockedTime.resourceIds ?? [])].filter(
    (resourceId): resourceId is string => Boolean(resourceId)
  );

  if (blockedResourceIds.length === 0) {
    return true;
  }

  const eventResourceIds = [event.resourceId, ...(event.resourceIds ?? [])].filter(
    (resourceId): resourceId is string => Boolean(resourceId)
  );

  return eventResourceIds.some((resourceId) => blockedResourceIds.includes(resourceId));
}

function isBlockedForColumn(blockedTime: BlockedTimeRange, column: CommonGridColumn) {
  const blockedResourceIds = [blockedTime.resourceId, ...(blockedTime.resourceIds ?? [])].filter(
    (resourceId): resourceId is string => Boolean(resourceId)
  );

  if (blockedResourceIds.length === 0) {
    return true;
  }

  return Boolean(column.resourceId && blockedResourceIds.includes(column.resourceId));
}

export function isBlockedEventChange(options: Options, view: ViewType, event: EventObject) {
  const blockedTimes = getBlockedTimesByView(options, view);
  const eventStart = getTimeValue(event.start);
  const eventEnd = getTimeValue(event.end);

  return blockedTimes.some((blockedTime) => {
    if (!isBlockedForResource(blockedTime, event)) {
      return false;
    }

    const blockedStart = getTimeValue(blockedTime.start);
    const blockedEnd = getTimeValue(blockedTime.end);

    return eventStart < blockedEnd && eventEnd > blockedStart;
  });
}

export function getBlockedTimeLayoutsForColumn(
  options: Options,
  view: ViewType,
  timeGridData: TimeGridData,
  column: CommonGridColumn
) {
  const blockedTimes = getBlockedTimesByView(options, view);

  if (blockedTimes.length === 0) {
    return [];
  }

  const visibleStart = setTimeStrToDate(column.date, timeGridData.rows[0].startTime);
  const visibleEnd = setTimeStrToDate(
    column.date,
    timeGridData.rows[timeGridData.rows.length - 1].endTime
  );
  const visibleDuration = visibleEnd.getTime() - visibleStart.getTime();

  return blockedTimes
    .filter((blockedTime) => isBlockedForColumn(blockedTime, column))
    .map((blockedTime) => {
      const blockedStart = new DayjsTZDate(blockedTime.start);
      const blockedEnd = new DayjsTZDate(blockedTime.end);
      const intersectStart = Math.max(blockedStart.getTime(), visibleStart.getTime());
      const intersectEnd = Math.min(blockedEnd.getTime(), visibleEnd.getTime());

      if (intersectStart >= intersectEnd) {
        return null;
      }

      return {
        top: ((intersectStart - visibleStart.getTime()) / visibleDuration) * 100,
        height: ((intersectEnd - intersectStart) / visibleDuration) * 100,
      };
    })
    .filter((layout): layout is { top: number; height: number } => Boolean(layout));
}

function getSelectionColumns(columns: CommonGridColumn[], selection: GridSelectionData) {
  return columns.slice(selection.startColumnIndex, selection.endColumnIndex + 1);
}

function getSelectionResources(columns: CommonGridColumn[]) {
  const resourceIds = uniq(
    columns
      .map((column) => column.resourceId)
      .filter((resourceId): resourceId is string => Boolean(resourceId))
  );

  return {
    resourceId: resourceIds.length === 1 ? resourceIds[0] : undefined,
    resourceIds: resourceIds.length > 0 ? resourceIds : undefined,
  };
}

export function createEventFromTimeGridSelection(
  timeGridData: TimeGridData,
  selection: GridSelectionData
): EventObject {
  const startColumn = timeGridData.columns[selection.startColumnIndex];
  const endColumn = timeGridData.columns[selection.endColumnIndex];
  const startRow = timeGridData.rows[selection.startRowIndex];
  const endRow = timeGridData.rows[selection.endRowIndex];
  const selectedColumns = getSelectionColumns(timeGridData.columns, selection);
  const { resourceId, resourceIds } = getSelectionResources(selectedColumns);

  return {
    title: '',
    category: 'time',
    allDay: false,
    start: setTimeStrToDate(startColumn.date, startRow.startTime),
    end: setTimeStrToDate(endColumn.date, endRow.endTime),
    resourceId,
    resourceIds,
  };
}

export function createRangeSelectionInfo(
  timeGridData: TimeGridData,
  selection: GridSelectionData,
  view: ViewType
) {
  const event = createEventFromTimeGridSelection(timeGridData, selection);
  const selectedColumns = getSelectionColumns(timeGridData.columns, selection);

  return {
    view,
    start: event.start as DayjsTZDate,
    end: event.end as DayjsTZDate,
    resourceId: event.resourceId,
    resourceIds: event.resourceIds,
    resourceNames: uniq(
      selectedColumns
        .map((column) => column.resourceName)
        .filter((resourceName): resourceName is string => Boolean(resourceName))
    ),
  };
}

export function createUpdatedTimeGridEvent(
  previousEvent: EventObjectWithDefaultValues,
  nextStart: DayjsTZDate,
  nextEnd: DayjsTZDate,
  targetColumn?: CommonGridColumn
): EventObject {
  const nextEvent: EventObject = {
    ...previousEvent,
    start: nextStart,
    end: nextEnd,
  };

  if (targetColumn?.resourceId) {
    nextEvent.resourceId = targetColumn.resourceId;
    nextEvent.resourceIds = [targetColumn.resourceId];
  }

  return nextEvent;
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

export function shouldAcceptEventChange(
  options: Options,
  callbacks: CalendarCallbacks | null | undefined,
  {
    action,
    view,
    event,
    previousEvent,
  }: {
    action: CalendarEventChangeAction;
    view: ViewType;
    event: EventObject;
    previousEvent?: EventObjectWithDefaultValues;
  }
) {
  if (view === 'scheduler') {
    const policySource =
      getDisabledSchedulerInteractionPolicySource(options, action, event, previousEvent) ??
      getDisabledSchedulerEventPolicySource(action, event, previousEvent);

    if (policySource) {
      dispatchEventChangeFailed(callbacks, {
        reason: 'policy',
        policySource,
        action,
        event,
        previousEvent,
      });
      return false;
    }
  }

  if (isBlockedEventChange(options, view, event)) {
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
