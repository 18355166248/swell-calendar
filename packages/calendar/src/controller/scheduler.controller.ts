import DayjsTZDate from '@/time/dayjs-tzdate';
import { setTimeStrToDate } from '@/time/datetime';
import { EventObject, EventObjectWithDefaultValues } from '@/types/events.type';
import { CommonGridColumn, TimeGridData } from '@/types/grid.type';
import { GridSelectionData } from '@/types/gridSelection.type';
import { BlockedTimeRange, Options, ViewType } from '@/types/options.type';
import { uniq } from 'lodash-es';
import {
  CalendarCallbacks,
  CalendarEventChangeAction,
} from '@/types/callbacks.type';

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
    return options.scheduler?.blockedTimes ?? [];
  }

  if (view === 'timeline') {
    return options.timeline?.blockedTimes ?? [];
  }

  if (view === 'week' || view === 'day') {
    return options.week?.blockedTimes ?? [];
  }

  return [];
}

function isBlockedForResource(blockedTime: BlockedTimeRange, event: EventObject) {
  const blockedResourceIds = [
    blockedTime.resourceId,
    ...(blockedTime.resourceIds ?? []),
  ].filter((resourceId): resourceId is string => Boolean(resourceId));

  if (blockedResourceIds.length === 0) {
    return true;
  }

  const eventResourceIds = [
    event.resourceId,
    ...(event.resourceIds ?? []),
  ].filter((resourceId): resourceId is string => Boolean(resourceId));

  return eventResourceIds.some((resourceId) => blockedResourceIds.includes(resourceId));
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
  if (isBlockedEventChange(options, view, event)) {
    return false;
  }

  return callbacks?.onValidateEventChange?.({
    action,
    view,
    event,
    previousEvent,
  }) ?? true;
}
