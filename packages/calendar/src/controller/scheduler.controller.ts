import { uniq } from 'lodash-es';

import { setTimeStrToDate } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { convertTimezone, needsTimezoneConversion } from '@/time/timezone';
import { ExternalDropPosition, ExternalDropResult } from '@/types/api.type';
import {
  CalendarCrossInstanceDropInfo,
  CalendarExternalDropFailedInfo,
  CalendarExternalDropInfo,
} from '@/types/callbacks.type';
import {
  TimeGridDropPreview,
  TimeGridDropPreviewSource,
  TimeGridDropPreviewStatus,
} from '@/types/dnd-preview.type';
import { EventObject, EventObjectWithDefaultValues } from '@/types/events.type';
import { CommonGridColumn, GridPosition, TimeGridData } from '@/types/grid.type';
import { GridSelectionData } from '@/types/gridSelection.type';
import { BlockedTimeRange, Options, ResourceInfo, ViewType } from '@/types/options.type';

export function getTimeValue(value: EventObject['start']) {
  if (!value) {
    return 0;
  }

  if (typeof value === 'number' || typeof value === 'string' || value instanceof Date) {
    return new Date(value).getTime();
  }

  return value.getTime();
}

export function getResourceIds(event: EventObject) {
  return [event.resourceId, ...(event.resourceIds ?? [])].filter(
    (resourceId): resourceId is string => Boolean(resourceId)
  );
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
  // 约束器设置了 allowedColumnIndices 时（scheduler 跨天同资源拖拽），
  // 只取被允许的列，跳过中间不同资源的列，避免事件错误地带上中间列的资源
  if (selection.allowedColumnIndices) {
    return selection.allowedColumnIndices
      .map((index) => columns[index])
      .filter((column): column is CommonGridColumn => Boolean(column));
  }

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
  // 携带 _displayTimezone 穿过 toEventObject → createUpdatedTimeGridEvent 链路
  const displayTimezone = (previousEvent as Record<string, unknown>)._displayTimezone as
    | string
    | undefined;

  const nextEvent: EventObject = {
    ...previousEvent,
    start: nextStart,
    end: nextEnd,
  };

  // 若存在 displayTimezone → sourceTz 反向映射，
  // 把显示时区的 nextStart/nextEnd 反转为数据时区的墙钟值，
  // 保证回调 payload 永远输出自洽的 start/end + timezone 组合
  if (displayTimezone && needsTimezoneConversion(previousEvent.timezone, displayTimezone)) {
    (nextEvent as EventObjectWithDefaultValues).start = convertTimezone(
      nextStart,
      displayTimezone,
      previousEvent.timezone!
    );
    (nextEvent as EventObjectWithDefaultValues).end = convertTimezone(
      nextEnd,
      displayTimezone,
      previousEvent.timezone!
    );
  }

  if (targetColumn?.resourceId) {
    const existingResourceIds =
      previousEvent.resourceIds ?? (previousEvent.resourceId ? [previousEvent.resourceId] : []);

    if (existingResourceIds.length > 1 && existingResourceIds.includes(targetColumn.resourceId)) {
      nextEvent.resourceId = targetColumn.resourceId;
      nextEvent.resourceIds = existingResourceIds;
    } else {
      nextEvent.resourceId = targetColumn.resourceId;
      nextEvent.resourceIds = [targetColumn.resourceId];
    }
  }

  return nextEvent;
}

/**
 * 从 grid 位置构造跨实例拖拽 drop intent
 *
 * 与 `buildExternalDropInfo` 不同，跨实例场景不携带 DataTransfer / data，
 * 事件数据由 bridge 传递而非 HTML5 DnD API 或编程式 drop。
 */
export function createCrossInstanceDropInfo(
  timeGridData: TimeGridData,
  position: GridPosition
): Omit<CalendarCrossInstanceDropInfo, 'event'> {
  const column = timeGridData.columns[position.columnIndex];
  const row = timeGridData.rows[position.rowIndex];

  const start = setTimeStrToDate(column.date, row.startTime);
  const end = setTimeStrToDate(column.date, row.endTime);

  return {
    date: new DayjsTZDate(column.date),
    start,
    end,
    resourceId: column.resourceId,
    resourceName: column.resourceName,
  };
}

export function createTimeGridDropPreview(
  source: TimeGridDropPreviewSource,
  status: TimeGridDropPreviewStatus,
  timeGridData: TimeGridData,
  position: GridPosition,
  event?: EventObject
): TimeGridDropPreview {
  const column = timeGridData.columns[position.columnIndex];
  const row = timeGridData.rows[position.rowIndex];

  const start = setTimeStrToDate(column.date, row.startTime);
  const end = setTimeStrToDate(column.date, row.endTime);

  return {
    source,
    status,
    position,
    start,
    end,
    resourceId: column.resourceId,
    resourceName: column.resourceName,
    event,
  };
}

/**
 * 检查外部 drop 位置是否命中 invalid 区间
 */
export function isBlockedExternalDrop(
  options: Options,
  view: ViewType,
  position: GridPosition,
  timeGridData: TimeGridData
): boolean {
  const column = timeGridData.columns[position.columnIndex];
  const row = timeGridData.rows[position.rowIndex];

  const dropStart = setTimeStrToDate(column.date, row.startTime);
  const dropEnd = setTimeStrToDate(column.date, row.endTime);

  // 构造一个临时 EventObject 用于复用 isBlockedEventChange
  const probeEvent: EventObject = {
    title: '',
    category: 'time',
    allDay: false,
    start: dropStart,
    end: dropEnd,
    resourceId: column.resourceId,
    resourceIds: column.resourceId ? [column.resourceId] : undefined,
  };

  return isBlockedEventChange(options, view, probeEvent);
}

/**
 * 获取外部拖拽在资源级是否被允许
 *
 * 优先级：资源级 allowExternalDrop > 全局 allowExternalDrop
 * - 资源显式 false：拒绝
 * - 资源显式 true 或缺省：跟随全局
 */
export function isExternalDropAllowedForResource(
  resources: ResourceInfo[] | undefined,
  resourceId: string | undefined,
  globalAllow: boolean
): { allowed: boolean; policySource: 'resource' | 'view' } {
  if (!resourceId || !resources) {
    return { allowed: globalAllow, policySource: 'view' };
  }

  const resource = resources.find((r) => r.id === resourceId);
  if (!resource) {
    return { allowed: globalAllow, policySource: 'view' };
  }

  if (resource.allowExternalDrop === false) {
    return { allowed: false, policySource: 'resource' };
  }

  if (resource.allowExternalDrop === true) {
    return { allowed: true, policySource: 'resource' };
  }

  return { allowed: globalAllow, policySource: 'view' };
}

/**
 * 编程式外部 drop 的纯计算函数
 *
 * 接收宿主坐标和自定义数据，复用 HTML5 路径的全部校验链：
 * 1. 位置解析（gridPositionFinder）
 * 2. 资源级 / 全局 `allowExternalDrop` gate
 * 3. `invalid` 区间检查
 *
 * 不做 DOM 操作、不触发回调。HTML5 `useExternalDrop` 与 imperative
 * `CalendarInstance.externalDrop` 共享此函数。
 *
 * 注意：与 HTML5 路径不同，本函数不校验 `allowExternalDrop` 全局开关本身——
 * 全局开关的判定在调用方（`CalendarInstance.externalDrop` 在 store 检查时
 * 短路、`useExternalDrop` 在 hook 入口短路）。本函数只做资源级细化判定。
 */
export function resolveExternalDrop(params: {
  position: ExternalDropPosition;
  gridPositionFinder: (position: { clientX: number; clientY: number }) => GridPosition | null;
  timeGridData: TimeGridData;
  options: Options;
  /** HTML5 路径：原始 DataTransfer，回传到 `info.dataTransfer` / `rejection.dataTransfer` */
  dataTransfer?: DataTransfer;
  /** 编程式 drop：宿主自定义数据，回传到 `info.data` / `rejection.data` */
  data?: unknown;
}): ExternalDropResult {
  const { position, gridPositionFinder, timeGridData, options, dataTransfer, data } = params;

  const resolved = gridPositionFinder(position);
  if (!resolved) {
    return { result: 'rejected' };
  }

  const column = timeGridData.columns[resolved.columnIndex];
  if (!column) {
    return { result: 'rejected' };
  }

  const schedulerOptions = options.scheduler;
  const globalAllow = schedulerOptions?.allowExternalDrop ?? false;

  // 1. 资源级 allowExternalDrop gate
  const { allowed, policySource } = isExternalDropAllowedForResource(
    schedulerOptions?.resources,
    column.resourceId,
    globalAllow
  );

  if (!allowed) {
    const preview = createTimeGridDropPreview('external', 'policy', timeGridData, resolved);
    const rejection = buildExternalDropRejection(timeGridData, resolved, {
      reason: 'policy',
      policySource,
      dataTransfer,
      data,
    });
    return { result: 'rejected', rejection, preview };
  }

  // 2. invalid 区间
  if (isBlockedExternalDrop(options, 'scheduler', resolved, timeGridData)) {
    const preview = createTimeGridDropPreview('external', 'invalid', timeGridData, resolved);
    const rejection = buildExternalDropRejection(timeGridData, resolved, {
      reason: 'invalid',
      dataTransfer,
      data,
    });
    return { result: 'rejected', rejection, preview };
  }

  // 3. 通过
  const info = buildExternalDropInfo(timeGridData, resolved, { dataTransfer, data });
  const preview = createTimeGridDropPreview('external', 'allowed', timeGridData, resolved);
  return { result: 'allowed', info, preview };
}

/**
 * 构造 drop 的 info（同时支持 HTML5 DataTransfer 与编程式 data）
 */
function buildExternalDropInfo(
  timeGridData: TimeGridData,
  position: GridPosition,
  extra: { dataTransfer?: DataTransfer; data?: unknown }
): CalendarExternalDropInfo {
  const column = timeGridData.columns[position.columnIndex];
  const row = timeGridData.rows[position.rowIndex];

  return {
    dataTransfer: extra.dataTransfer,
    data: extra.data,
    date: new DayjsTZDate(column.date),
    start: setTimeStrToDate(column.date, row.startTime),
    end: setTimeStrToDate(column.date, row.endTime),
    resourceId: column.resourceId,
    resourceName: column.resourceName,
  };
}

/**
 * 构造 drop 的 rejection（同时支持 HTML5 DataTransfer 与编程式 data）
 */
function buildExternalDropRejection(
  timeGridData: TimeGridData,
  position: GridPosition,
  extra: {
    reason: CalendarExternalDropFailedInfo['reason'];
    policySource?: 'resource' | 'view';
    dataTransfer?: DataTransfer;
    data?: unknown;
  }
): CalendarExternalDropFailedInfo {
  const column = timeGridData.columns[position.columnIndex];
  const row = timeGridData.rows[position.rowIndex];

  return {
    reason: extra.reason,
    policySource: extra.policySource,
    dataTransfer: extra.dataTransfer,
    data: extra.data,
    date: new DayjsTZDate(column.date),
    start: setTimeStrToDate(column.date, row.startTime),
    end: setTimeStrToDate(column.date, row.endTime),
    resourceId: column.resourceId,
  };
}
