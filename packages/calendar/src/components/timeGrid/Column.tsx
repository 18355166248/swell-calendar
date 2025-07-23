import { cls } from '@/helpers/css';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { GridSelectionByColumn } from './GridSelectionByColumn';
import { EventUIModel } from '@/model/eventUIModel';
import { TimeEvent } from '../events/TimeEvent';
import ResizingEventShadow from './ResizingEventShadow';

/**
 * CSS 类名常量定义
 * 用于统一管理组件的样式类名
 */
const classNames = {
  column: cls('column'), // 时间列容器
  backgrounds: cls('background-events'), // 背景事件容器
  events: cls('events'), // 事件容器
};

interface ColumnProps {
  width: string;
  columnIndex: number;
  timeGridData: TimeGridData;
  totalUIModels: EventUIModel[][];
  gridPositionFinder: GridPositionFinder;
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
  totalUIModels,
  gridPositionFinder,
}: ColumnProps) {
  const uiModelsByColumn = totalUIModels[columnIndex];

  // 最小时间区间高度
  const minEventHeight = timeGridData.rows[0].height;

  return (
    <div
      className={cls('column')}
      style={{ width: '100%', backgroundColor: 'rgba(81, 92, 230, 0.05)' }}
    >
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
