import type { DayjsTZDateType } from '@/time/dayjs-tzdate.types';
import type { ClientMousePosition } from '@/types/mouse';
import type { FormattedTimeString } from '@/types/datetime';

export interface GridUIModel {
  day: number;
  width: number;
  left: number;
}

export interface GridPosition {
  columnIndex: number;
  rowIndex: number;
}

export interface CommonGridColumn {
  date: DayjsTZDateType;
  left: number;
  width: number;
}

export interface TimeGridRow {
  top: number;
  height: number;
  startTime: FormattedTimeString;
  endTime: FormattedTimeString;
}

export interface TimeGridData {
  rows: TimeGridRow[];
  columns: CommonGridColumn[];
}

export type GridPositionFinder = (mousePosition: ClientMousePosition) => GridPosition | null;
