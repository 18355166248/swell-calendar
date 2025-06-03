export type EventView = 'allday' | 'time';
export type TaskView = 'milestone' | 'task';

export type ViewType = 'month' | 'week' | 'day';

export interface Options {
  // 默认视图类型
  defaultView?: ViewType;
  // 周视图选项
  week?: WeekOptions;
}

export interface WeekOptions {
  startDayOfWeek?: number;
  dayNames?: [string, string, string, string, string, string, string] | [];
  narrowWeekend?: boolean; // 定义了周末日期列在日历视图中是否被显示为更窄的列 月视图（month）和周/日视图（week/day）
  hourStart?: number;
  hourEnd?: number;
  eventView?: boolean | EventView[];
  taskView?: boolean | TaskView[];
}
