import { DeepPartial } from 'ts-essentials';
import { ThemeState } from './theme.type';
import { TemplateConfig } from './template.type';
import { DndState } from './dnd.type';

export type EventView = 'allday' | 'time';
export type TaskView = 'milestone' | 'task';

export type ViewType = 'month' | 'week' | 'day';

// 时间分隔配置：2表示半小时一块，4表示15分钟一块
export type HourDivision = 2 | 4;

export interface Options {
  // 默认视图类型
  defaultView?: ViewType;
  theme?: DeepPartial<ThemeState>;
  // 周视图选项
  week?: WeekOptions;
  // 模板配置
  template?: TemplateConfig;
  // 拖拽配置
  dnd?: DndState;
  // 是否为只读模式
  isReadOnly?: boolean;
}

export interface WeekOptions {
  // 一周开始的日期，0 表示周日，1 表示周一，以此类推
  startDayOfWeek?: number;
  // 自定义星期名称数组，按照周日到周六的顺序
  dayNames?: [string, string, string, string, string, string, string] | [];
  // 定义了周末日期列在日历视图中是否被显示为更窄的列 月视图（month）和周/日视图（week/day）
  narrowWeekend?: boolean;
  // 日历显示的开始小时（24小时制）
  hourStart?: number;
  // 日历显示的结束小时（24小时制）
  hourEnd?: number;
  // 事件视图配置，true 表示显示所有类型，false 表示不显示，数组表示显示指定类型
  eventView?: boolean | EventView[];
  // 任务视图配置，true 表示显示所有类型，false 表示不显示，数组表示显示指定类型
  taskView?: boolean | TaskView[];
  // 每小时的时间分隔数，2 表示半小时一块，4 表示15分钟一块，默认为2
  hourDivision?: HourDivision;
  // 是否为工作日模式，只显示工作日（周一到周五）
  workweek?: boolean;
}

export type OptionsSlice = {
  options: Omit<Required<Options>, 'theme' | 'template'>;
};
