import { useCalendarStore } from '@/contexts/calendarStore';
import { useThemeStore } from '@/contexts/themeStore';
import { cls, toPercent } from '@/helpers/css';
import { timeGridSelectionHelper } from '@/helpers/gridSelection';
import { TimeGridRow } from '@/types/grid.type';
import { isNil } from 'lodash-es';
import { useMemo } from 'react';

export function GridSelectionByColumn({
  columnIndex,
  timeGridRows,
}: {
  columnIndex: number;
  timeGridRows: TimeGridRow[];
}) {
  // 分别获取需要的状态，避免在 selector 中创建新函数
  const timeGridSelection = useCalendarStore((state) => state.gridSelection.timeGrid);
  const maxRowIndex = timeGridRows.length - 1;

  // 使用 useMemo 缓存计算结果，避免不必要的重新计算
  const gridSelectionData = useMemo(() => {
    return timeGridSelectionHelper.calculateSelection(timeGridSelection, columnIndex, maxRowIndex);
  }, [timeGridSelection, columnIndex, maxRowIndex]);

  const gridSelectionProps = useMemo(() => {
    if (isNil(gridSelectionData)) {
      return null;
    }
    // 获取选择区域的起始和结束行索引
    const { startRowIndex, endRowIndex, isStartingColumn, isSelectingMultipleColumns } =
      gridSelectionData;

    // 获取开始行的位置和开始时间
    const { top: startRowTop, startTime: startRowStartTime } = timeGridRows[startRowIndex];
    // 获取结束行的位置、高度和结束时间
    const {
      top: endRowTop,
      height: endRowHeight,
      endTime: endRowEndTime,
    } = timeGridRows[endRowIndex];

    // 获取总高度
    const gridSelectionHeight = endRowTop - startRowTop + endRowHeight;

    // 构建显示的时间文本
    let text = `${startRowStartTime} - ${endRowEndTime}`;

    // 如果正在选择多列，只在起始列显示时间
    if (isSelectingMultipleColumns) {
      text = isStartingColumn ? startRowStartTime : '';
    }

    return {
      top: startRowTop,
      height: gridSelectionHeight,
      text,
    };
  }, [gridSelectionData, timeGridRows]);

  if (isNil(gridSelectionProps)) {
    return null;
  }

  return <GridSelection {...gridSelectionProps} />;
}

function GridSelection({ top, height, text }: { top: number; height: number; text: string }) {
  // 直接使用选择器函数，不需要 useMemo 包装
  const common = useThemeStore((state) => state.common.gridSelection);
  const week = useThemeStore((state) => state.week.gridSelection);
  const { backgroundColor, border } = common;
  const { color } = week;
  const style = {
    top: toPercent(top),
    height: toPercent(height),
    backgroundColor,
    border,
  };

  return (
    <div className={cls('grid-selection')} style={style}>
      {text.length > 0 ? (
        <span className={cls('grid-selection-text')} style={{ color }}>
          {text}
        </span>
      ) : null}
    </div>
  );
}
