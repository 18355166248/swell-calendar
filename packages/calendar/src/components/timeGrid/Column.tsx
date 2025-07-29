import { cls, toPercent } from '@/helpers/css';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { GridSelectionByColumn } from './GridSelectionByColumn';
import { EventUIModel } from '@/model/eventUIModel';
import { TimeEvent } from '../events/TimeEvent';
import ResizingEventShadow from './ResizingEventShadow';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { isSameDate, isWeekend } from '@/time/datetime';
import { ThemeState } from '@/types/theme.type';
import { useThemeStore } from '@/contexts/themeStore';
import { useMemo } from 'react';

/**
 * 获取列的背景色
 * 根据日期类型（今天、周末、普通工作日）返回对应的背景色
 *
 * @param today - 今天的日期
 * @param columnDate - 当前列的日期
 * @param defaultBackgroundColor - 默认背景色
 * @param todayBackgroundColor - 今天背景色
 * @param weekendBackgroundColor - 周末背景色
 * @returns 对应的背景色字符串
 */
function getBackgroundColor({
  today,
  columnDate,
  defaultBackgroundColor,
  todayBackgroundColor,
  weekendBackgroundColor,
}: {
  today: DayjsTZDate;
  columnDate: DayjsTZDate;
  defaultBackgroundColor: string;
  todayBackgroundColor: string;
  weekendBackgroundColor: string;
}) {
  // 判断是否为今天的列
  const isTodayColumn = isSameDate(today, columnDate);
  // 判断是否为周末
  const isWeekendColumn = isWeekend(columnDate.getDay());

  // 优先级：今天 > 周末 > 默认
  if (isTodayColumn) {
    return todayBackgroundColor;
  }

  if (isWeekendColumn) {
    return weekendBackgroundColor;
  }

  return defaultBackgroundColor;
}

/**
 * CSS 类名常量定义
 * 用于统一管理组件的样式类名
 */
const classNames = {
  backgrounds: cls('background-events'), // 背景事件容器
  events: cls('events'), // 事件容器
};

interface ColumnProps {
  width: string;
  columnIndex: number;
  timeGridData: TimeGridData;
  columnDate: DayjsTZDate;
  totalUIModels: EventUIModel[][];
  gridPositionFinder: GridPositionFinder;
  isLastColumn: boolean;
}

/**
 * 垂直事件组件
 * 渲染时间网格中的垂直排列的事件
 *
 * @param eventUIModels - 事件UI模型数组
 * @param minEventHeight - 事件最小高度
 */
function VerticalEvents({
  eventUIModels,
  minEventHeight,
}: {
  eventUIModels: EventUIModel[];
  minEventHeight: number;
}) {
  // @TODO: 使用动态值替代硬编码的右边距
  const style = { marginRight: 8 };

  return (
    <div className={classNames.events} style={style}>
      {eventUIModels.map((eventUIModel) => (
        <TimeEvent
          key={`${eventUIModel.valueOf()}-${eventUIModel.cid()}`}
          uiModel={eventUIModel}
          minHeight={minEventHeight}
        />
      ))}
    </div>
  );
}

function Column({
  width,
  columnIndex,
  timeGridData,
  columnDate,
  totalUIModels,
  gridPositionFinder,
  isLastColumn,
}: ColumnProps) {
  const uiModelsByColumn = totalUIModels[columnIndex];

  // 获取当前时区的当前时间
  const today = new DayjsTZDate();

  // 直接使用选择器函数，不需要 useMemo 包装
  const borderRight = useThemeStore((state) => state.week.dayGrid.borderRight);
  const defaultBackgroundColor = useThemeStore((state) => state.week.dayGrid.backgroundColor);
  const todayBackgroundColor = useThemeStore((state) => state.week.today.backgroundColor);
  const weekendBackgroundColor = useThemeStore((state) => state.week.weekend.backgroundColor);

  // 使用 useMemo 缓存背景色计算结果 不然会死循环
  const backgroundColor = useMemo(() => {
    return getBackgroundColor({
      today,
      columnDate,
      defaultBackgroundColor,
      todayBackgroundColor,
      weekendBackgroundColor,
    });
  }, [today, columnDate, defaultBackgroundColor, todayBackgroundColor, weekendBackgroundColor]);

  const style = { width, backgroundColor, borderRight: isLastColumn ? 'none' : borderRight };

  // 最小时间区间高度
  const minEventHeight = timeGridData.rows[0].height;

  return (
    <div className={cls('column')} style={style}>
      {/* 渲染多个事件 */}
      <VerticalEvents eventUIModels={uiModelsByColumn} minEventHeight={minEventHeight} />

      {/* 渲染调整上下区间的事件 */}
      <ResizingEventShadow
        gridPositionFinder={gridPositionFinder}
        timeGridData={timeGridData}
        columnIndex={columnIndex}
        totalUIModels={totalUIModels}
      />

      {/* 渲染网格选择 */}
      <GridSelectionByColumn columnIndex={columnIndex} timeGridRows={timeGridData.rows} />
    </div>
  );
}

export default Column;
