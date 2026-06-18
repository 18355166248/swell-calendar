import type { CSSProperties } from 'react';
import { DeepPartial } from 'ts-essentials';

import DayjsTZDate from '@/time/dayjs-tzdate';

import { CalendarInfo } from './calendar.type';
import { CalendarCallbacks } from './callbacks.type';
import { CalendarExternalDropFailedInfo, CalendarExternalDropInfo } from './callbacks.type';
import { TimeGridDropPreview } from './dnd-preview.type';
import { DateType, EventObject, EventObjectWithDefaultValues } from './events.type';
import { Options, ViewType } from './options.type';
import { ThemeState } from './theme.type';
import { NavigateDirection } from './view.type';

/**
 * 编程式外部 drop 位置输入
 */
export interface ExternalDropPosition {
  clientX: number;
  clientY: number;
}

/**
 * 编程式外部 drop（`CalendarInstance.externalDrop` / `resolveExternalDrop`）的返回值
 */
export type ExternalDropResult =
  | {
      /** 校验通过，宿主可读取 `info` 创建事件 */
      result: 'allowed';
      info: CalendarExternalDropInfo;
      preview: TimeGridDropPreview;
    }
  | {
      /** 校验未通过（位置无效 / 策略限制 / 命中 invalid） */
      result: 'rejected';
      /** 校验拒绝详情；位置无法解析时为 undefined */
      rejection?: CalendarExternalDropFailedInfo;
      preview?: TimeGridDropPreview;
    };

export interface CalendarInstance {
  getDate: () => DayjsTZDate;
  setDate: (date: DateType) => void;
  setView: (view: ViewType) => void;
  navigate: (direction: NavigateDirection) => void;
  goToToday: () => void;
  setEvents: (events: EventObject[]) => void;
  getEvents: () => EventObjectWithDefaultValues[];
  /**
   * 编程式外部 drop
   *
   * 供使用第三方 DnD 库（dnd-kit、react-beautiful-dnd 等）的宿主调用。
   * 传入客户端坐标和自定义数据，由库内部完成位置解析、校验和 intent 产出。
   *
   * 仅在 scheduler 视图且 `allowExternalDrop` 开启时生效；其它情况返回
   * `{ result: 'rejected' }`。
   *
   * 注意：此方法不触发 `onExternalDrop` / `onExternalDropFailed` 回调——
   * 返回值已包含完整 intent 与拒绝详情，宿主根据返回值自行决定下一步。
   */
  externalDrop: (params: ExternalDropPosition & { data?: unknown }) => ExternalDropResult;
}

export interface EventCalendarProps {
  events?: EventObject[];
  calendars?: CalendarInfo[];
  options?: Options;
  theme?: DeepPartial<ThemeState>;
  callbacks?: CalendarCallbacks;
  className?: string;
  style?: CSSProperties;
}
