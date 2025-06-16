import type { ClientMousePosition } from '@/types/mouse.type';
import type { FormattedTimeString } from '@/types/datetime.type';
import DayjsTZDate from '@/time/dayjs-tzdate';

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
  date: DayjsTZDate;
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
